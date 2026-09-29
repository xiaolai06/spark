"""运行配置。

首期后端跑在开发电脑上，用于前端联调；生产部署到机器人 Ubuntu 时
只需通过环境变量覆盖 DATABASE_URL、JWT_SECRET 等配置。
"""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# ---------- 数据库 ----------
DATABASE_URL = os.getenv("SPARK_DATABASE_URL", f"sqlite:///{(DATA_DIR / 'spark.db').as_posix()}")

# ---------- 令牌 ----------
JWT_SECRET = os.getenv("SPARK_JWT_SECRET", "spark-dev-secret-change-me-in-production")
JWT_ALGORITHM = "HS256"
def _int_env(name: str, default: int) -> int:
    """读取整数环境变量：非法值回退到默认值，避免启动即崩。"""
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


# ---------- 服务端口 ----------
# 本机 8000/8001 常被其他项目占用，默认使用 8010
API_PORT = _int_env("SPARK_API_PORT", 8010)

# ---------- 令牌有效期 ----------
ACCESS_TOKEN_TTL_MINUTES = _int_env("SPARK_TOKEN_TTL_MINUTES", 720)

# ---------- 跨域 ----------
# 前端开发服务器端口不固定（本机 5173-5180 已被多个项目占用，Vite 会顺延），
# 因此默认放行本机任意端口，生产环境应通过 SPARK_CORS_ORIGINS 指定具体域名。
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("SPARK_CORS_ORIGINS", "").split(",")
    if origin.strip()
]

# 开发阶段允许 localhost / 127.0.0.1 的任意端口
CORS_ALLOW_ORIGIN_REGEX = os.getenv(
    "SPARK_CORS_ORIGIN_REGEX", r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
)

# ---------- 演示账号 ----------
# 注意：不要用 .local / .test / .example 等保留域名，
# pydantic EmailStr 会把它们当作特殊用途域名直接拒绝。
SEED_USER_EMAIL = os.getenv("SPARK_SEED_EMAIL", "student@sparklab.cn")
SEED_USER_PASSWORD = os.getenv("SPARK_SEED_PASSWORD", "spark2026")
SEED_USER_NAME = "学生用户"
SEED_USER_STUDENT_ID = "2026010101"

# ---------- 服务端口 ----------
# 本机 8000/8001 常被其他项目占用，默认使用 8010
API_PORT = _int_env("SPARK_API_PORT", 8010)

# ---------- 目标机器人 ----------
DEFAULT_ROBOT_ID = "spark-01"
