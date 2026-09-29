"""请求/响应模型。

校验规则与前端 lib/validation.ts 保持一致，服务端不信任前端校验结果。
"""
from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
PHONE_RE = re.compile(r"^1[3-9]\d{9}$")
STUDENT_ID_RE = re.compile(r"^\d{8,12}$")


# --------------------------------------------------------------------------- #
# 认证
# --------------------------------------------------------------------------- #
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=20)
    email: EmailStr
    studentId: str = Field(min_length=8, max_length=12)
    password: str = Field(min_length=8, max_length=64)
    department: str = Field(default="智能控制学院", max_length=60)

    @field_validator("email")
    @classmethod
    def _check_email(cls, value: str) -> str:
        if not EMAIL_RE.match(value):
            raise ValueError("请输入正确的邮箱地址")
        return value.lower()

    @field_validator("studentId")
    @classmethod
    def _check_student_id(cls, value: str) -> str:
        if not STUDENT_ID_RE.match(value):
            raise ValueError("学号应为 8-12 位数字")
        return value

    @field_validator("password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        if not re.search(r"[a-zA-Z]", value) or not re.search(r"\d", value):
            raise ValueError("密码需同时包含字母和数字")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=64)


class UpdateProfileRequest(BaseModel):
    name: str = Field(min_length=2, max_length=20)
    studentId: str = Field(min_length=8, max_length=12)
    phone: str = Field(default="", max_length=20)
    department: str = Field(default="", max_length=60)
    role: str = Field(default="student", pattern="^(student|teacher|admin)$")

    @field_validator("studentId")
    @classmethod
    def _check_student_id(cls, value: str) -> str:
        if not STUDENT_ID_RE.match(value):
            raise ValueError("学号应为 8-12 位数字")
        return value

    @field_validator("phone")
    @classmethod
    def _check_phone(cls, value: str) -> str:
        if value and not PHONE_RE.match(value):
            raise ValueError("请输入正确的 11 位手机号")
        return value


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(min_length=1, max_length=64)
    newPassword: str = Field(min_length=8, max_length=64)

    @field_validator("newPassword")
    @classmethod
    def _check_password(cls, value: str) -> str:
        if not re.search(r"[a-zA-Z]", value) or not re.search(r"\d", value):
            raise ValueError("新密码需同时包含字母和数字")
        return value


class UserOut(BaseModel):
    """对外用户信息，字段固定为驼峰，与 Web 契约一致。"""

    id: str
    name: str
    email: str
    studentId: str
    phone: str
    department: str
    role: str
    createdAt: datetime


class AuthSession(BaseModel):
    """登录/注册成功后返回的会话信息。"""

    token: str
    expiresIn: int
    tokenType: str = "Bearer"
    user: UserOut
