"""认证路由：注册、登录、当前用户、修改资料、修改密码。

所有接口都要求 Authorization: Bearer <token>（注册与登录除外）。
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import OperationLog, User
from ..schemas import (
    AuthSession,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfileRequest,
    UserOut,
)
from ..security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _log(db: Session, user_id: str, action: str, detail: str = "") -> None:
    db.add(OperationLog(user_id=user_id, action=action, detail=detail))
    db.commit()


def _to_user_out(user: User) -> UserOut:
    """ORM 字段为 snake_case，对外契约固定为 camelCase，因此显式映射。

    不直接用 from_attributes 自动推导：那样会把 student_id/created_at
    泄露成 snake_case，或因字段名不匹配而校验失败。
    """
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        studentId=user.student_id,
        phone=user.phone,
        department=user.department,
        role=user.role,
        createdAt=user.created_at,
    )


def _issue(user: User) -> AuthSession:
    token, expires_in = create_access_token(user.id)
    return AuthSession(token=token, expiresIn=expires_in, user=_to_user_out(user))


@router.post("/register", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthSession:
    exists = db.scalar(
        select(User).where(
            (User.email == payload.email) | (User.student_id == payload.studentId)
        )
    )
    if exists is not None:
        field = "邮箱" if exists.email == payload.email else "学号"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "ACCOUNT_EXISTS", "message": f"该{field}已注册，请直接登录"},
        )

    user = User(
        id=f"u-{uuid.uuid4().hex[:12]}",
        name=payload.name.strip(),
        email=payload.email,
        student_id=payload.studentId,
        phone="",
        department=payload.department,
        role="student",
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _log(db, user.id, "register", f"新账号注册：{user.email}")
    return _issue(user)


@router.post("/login", response_model=AuthSession)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthSession:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    # 用户不存在与密码错误返回同一提示，避免暴露账号是否注册
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "邮箱或密码不正确，请重试"},
        )
    _log(db, user.id, "login", "登录成功")
    return _issue(user)


@router.get("/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user)) -> UserOut:
    return _to_user_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    conflict = db.scalar(
        select(User).where(User.student_id == payload.studentId, User.id != user.id)
    )
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "ACCOUNT_EXISTS", "message": "该学号已被其他账号使用"},
        )

    user.name = payload.name.strip()
    user.student_id = payload.studentId
    user.phone = payload.phone
    user.department = payload.department
    user.role = payload.role
    db.commit()
    db.refresh(user)
    _log(db, user.id, "update_profile", "修改个人资料")
    return _to_user_out(user)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    if not verify_password(payload.currentPassword, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PASSWORD_MISMATCH", "message": "当前密码不正确"},
        )
    if payload.currentPassword == payload.newPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PASSWORD_UNCHANGED", "message": "新密码不能与当前密码相同"},
        )

    user.password_hash = hash_password(payload.newPassword)
    db.commit()
    _log(db, user.id, "change_password", "修改登录密码")
