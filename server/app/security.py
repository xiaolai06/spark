"""密码哈希与 JWT 令牌。

密码使用标准库 pbkdf2_hmac 加盐哈希，避免 Windows 上编译 bcrypt 的问题；
令牌使用 HS256 JWT，由前端 Authorization: Bearer <token> 携带。
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import ACCESS_TOKEN_TTL_MINUTES, JWT_ALGORITHM, JWT_SECRET
from .db import get_db
from .models import User

_PBKDF2_ROUNDS = 260_000
_SALT_BYTES = 16

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """返回格式：pbkdf2_sha256$rounds$salt_hex$hash_hex"""
    salt = os.urandom(_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ROUNDS)
    return "pbkdf2_sha256${}${}${}".format(
        _PBKDF2_ROUNDS, salt.hex(), base64.b64encode(digest).decode()
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, rounds, salt_hex, digest_b64 = stored.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        expected = base64.b64decode(digest_b64)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds)
        )
        return hmac.compare_digest(expected, actual)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str) -> tuple[str, int]:
    """返回 (token, 有效期秒数)。"""
    ttl = timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES)
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "iat": int(now.timestamp()), "exp": int((now + ttl).timestamp())}
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, int(ttl.total_seconds())


_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"code": "AUTH_TOKEN_INVALID", "message": "登录状态已失效，请重新登录"},
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise _CREDENTIALS_ERROR
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError as exc:  # 过期、签名错误等
        raise _CREDENTIALS_ERROR from exc

    if not user_id:
        raise _CREDENTIALS_ERROR

    user = db.get(User, user_id)
    if user is None:
        raise _CREDENTIALS_ERROR
    return user


def decode_token_or_none(token: str | None) -> str | None:
    """校验 JWT 并返回用户 ID；无效或缺失返回 None。"""
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")


def authenticate_websocket(websocket: WebSocket) -> str:
    """WebSocket 鉴权，返回用户 ID。

    浏览器的 WebSocket 握手无法自定义 Authorization 头，
    因此令牌通过查询参数 ?token= 传入，握手阶段校验失败直接以 1008 关闭。
    """
    user_id = decode_token_or_none(websocket.query_params.get("token"))
    if user_id is None:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="AUTH_TOKEN_INVALID"
        )
    return user_id
