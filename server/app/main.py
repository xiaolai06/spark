"""FastAPI 应用入口。

启动：
    cd D:\\desktop\\spark\\server
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import (
    CORS_ALLOW_ORIGIN_REGEX,
    CORS_ORIGINS,
    SEED_USER_EMAIL,
    SEED_USER_NAME,
    SEED_USER_PASSWORD,
    SEED_USER_STUDENT_ID,
)
from .db import Base, SessionLocal, engine
from .models import User
from .routers import auth, robots
from .security import hash_password

logger = logging.getLogger("spark.server")


def seed_demo_user() -> None:
    """写入演示账号，保证首次启动即可登录联调。"""
    with SessionLocal() as db:
        if db.get(User, "u-seed-0001") is None:
            db.add(
                User(
                    id="u-seed-0001",
                    name=SEED_USER_NAME,
                    email=SEED_USER_EMAIL,
                    student_id=SEED_USER_STUDENT_ID,
                    phone="13800000000",
                    department="智能控制学院",
                    role="student",
                    password_hash=hash_password(SEED_USER_PASSWORD),
                )
            )
            db.commit()
            logger.info("已创建演示账号 %s", SEED_USER_EMAIL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_demo_user()
    yield


app = FastAPI(
    title="Spark 轮足机器人 Web 平台后端",
    version="0.1.0",
    description="首期仅实现账号体系与机器人只读接口；控制类接口在安全门禁通过前不产生真实运动。",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    # 开发阶段前端端口不固定，放行本机任意端口；生产应由 SPARK_CORS_ORIGINS 限定
    allow_origin_regex=CORS_ALLOW_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(robots.router)


@app.get("/api/v1/health", tags=["meta"])
def health() -> dict[str, object]:
    return {"status": "ok", "mode": "frontend-integration", "version": app.version}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """统一错误响应：{"error": {"code", "message", "details"}}。"""
    detail = exc.detail
    if isinstance(detail, dict):
        payload = detail
    else:
        payload = {"code": f"HTTP_{exc.status_code}", "message": str(detail)}
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": payload.get("code", "UNKNOWN"), "message": payload.get("message", ""), "details": payload.get("details", {})}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """把 Pydantic 校验错误转成前端可展示的中文提示。"""
    first = exc.errors()[0] if exc.errors() else {}
    message = first.get("msg", "请求参数不合法")
    # 去掉 pydantic 附加前缀，例如 "Value error, 学号应为 8-12 位数字"
    if message.startswith("Value error, "):
        message = message[len("Value error, ") :]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": "VALIDATION_ERROR", "message": message, "details": {}}},
    )
