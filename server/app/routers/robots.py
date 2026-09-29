"""机器人相关接口与控制占位。

数据来源当前是进程内的演示状态（mock），字段严格对齐最终说明 7.2/7.3 契约：
- 没有真实来源的字段一律返回 null，前端显示 --；
- 电池在底盘运行态确认前保持 null；
- 控制类接口在安全门禁通过前只做状态管理，不产生真实运动；
- 所有接口都要求登录，WebSocket 在握手阶段校验令牌。
"""
from __future__ import annotations

import asyncio
import contextlib
import time
import uuid
from collections.abc import Callable
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    WebSocketException,
    status,
)

from ..models import User
from ..security import authenticate_websocket, get_current_user

router = APIRouter(tags=["robots"])


def _to_float(value: Any, default: float = 0.0) -> float:
    """安全转 float：非法输入回退到默认值，不抛出 500。"""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


# --------------------------------------------------------------------------- #
# 进程内演示状态
# --------------------------------------------------------------------------- #
def _build_status() -> dict[str, Any]:
    """对应 GET /api/v1/robots/{robotId}/status 的结构。"""
    return {
        "robotId": "spark-01",
        "name": "Spark-01",
        "model": "NXROBO Spark",
        "online": True,
        "mode": "自主导航",
        "network": {"ip": "192.168.3.18", "latencyMs": 22, "status": "online"},
        "system": {
            "cpuUsage": 32.0,
            "cpuTemperature": 54.0,
            "memoryUsedGb": 2.7,
            "memoryTotalGb": 7.6,
            "memoryUsage": 41.5,
            "diskUsedGb": 48,
            "diskTotalGb": 109,
            "diskUsage": 46.0,
            "uptimeSeconds": 10440,
        },
        # 电池真实来源未确认，保持 null
        "power": {
            "percentage": None,
            "voltage": None,
            "current": None,
            "temperature": None,
            "chargingStatus": "unknown",
        },
        "motion": {"linearVelocity": 0.25, "angularVelocity": 0.0},
        "pose": {"x": 2.35, "y": 1.82, "yaw": 87.3},
        "sensors": {
            "base": "online",
            "lidar": "online",
            "rgbCamera": "online",
            "depthCamera": "online",
            "imu": "online",
            "arm": "unknown",
            "voice": "online",
        },
        "navigation": {"status": "moving", "target": "实验台 A", "distanceRemaining": 2.48},
        "task": {"id": "task-001", "name": "前往实验台 A", "status": "running", "progress": 62},
        "emergencyStop": STATE["emergency_stop"],
    }


STATE: dict[str, Any] = {
    "emergency_stop": False,
    "navigation": {
        "status": "moving",
        "goal": {"x": 2.35, "y": 1.82, "yaw": 87.3},
        "distanceRemaining": 2.48,
    },
    "lease": None,
    "voice_records": [
        {
            "id": "v-1",
            "time": "14:28:16",
            "text": "去实验台 A",
            "source": "robot",
            "intent": "前往指定位置",
            "confidence": 0.96,
            "status": "done",
        }
    ],
}

WAYPOINTS: list[dict[str, Any]] = [
    {"id": "wp-start", "name": "起点", "code": "start", "x": 0.50, "y": 0.80, "yaw": 0.0},
    {"id": "wp-lab-a", "name": "实验台 A", "code": "lab-a", "x": 2.35, "y": 1.82, "yaw": 1.57},
    {"id": "wp-lab-b", "name": "实验台 B", "code": "lab-b", "x": 1.20, "y": 1.65, "yaw": 0.0},
    {"id": "wp-equip", "name": "器材区", "code": "equipment", "x": 0.85, "y": 1.10, "yaw": 0.0},
    {"id": "wp-door", "name": "门口", "code": "door", "x": 2.60, "y": 0.90, "yaw": 1.57},
    {"id": "wp-charge", "name": "充电区", "code": "charge", "x": 2.50, "y": 1.20, "yaw": 3.14},
]


def _fail(code: str, message: str, http_code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(
        status_code=http_code, detail={"code": code, "message": message, "details": {}}
    )


def _require_robot(robot_id: str) -> None:
    if robot_id != "spark-01":
        raise _fail("ROBOT_NOT_FOUND", f"机器人 {robot_id} 不存在", status.HTTP_404_NOT_FOUND)


# --------------------------------------------------------------------------- #
# WebSocket 共用逻辑
# --------------------------------------------------------------------------- #
async def _watch_disconnect(websocket: WebSocket) -> None:
    """专门负责接收的协程。

    若主循环只发送不接收，就无法感知客户端断开，处理函数永远不会结束，
    会造成连接与协程泄漏（实测每次打开页面多一条常驻连接）。
    这里用独立协程阻塞在 receive 上，断开时结束主循环。
    """
    try:
        while True:
            await websocket.receive()
    except (WebSocketDisconnect, RuntimeError):
        return


async def _push_loop(websocket: WebSocket, build_payload: Callable[[int], dict[str, Any]]) -> None:
    """周期推送事件，并正确感知客户端断开。"""
    watcher = asyncio.create_task(_watch_disconnect(websocket))
    seq = 0
    try:
        while True:
            seq += 1
            await websocket.send_json(build_payload(seq))
            try:
                await asyncio.wait_for(asyncio.shield(watcher), timeout=2.0)
            except asyncio.TimeoutError:
                continue  # 客户端没发消息，正常继续推送
            # watcher 已结束说明连接断开，退出循环并让处理函数正常结束
            return
    except (WebSocketDisconnect, RuntimeError, WebSocketException):
        return
    finally:
        watcher.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await watcher


# --------------------------------------------------------------------------- #
# 机器人
# --------------------------------------------------------------------------- #
@router.get("/api/v1/robots")
def list_robots(current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    return [
        {
            "id": "spark-01",
            "name": "Spark-01",
            "role": "实验室主机器人",
            "model": "NXROBO Spark",
            "ros": "noetic",
            "ip": "192.168.3.18",
            "online": True,
        }
    ]


@router.get("/api/v1/robots/{robot_id}")
def get_robot(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    _require_robot(robot_id)
    return list_robots(current_user)[0]


@router.get("/api/v1/robots/{robot_id}/status")
def get_robot_status(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    _require_robot(robot_id)
    return _build_status()


@router.get("/api/v1/robots/{robot_id}/capabilities")
def get_capabilities(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    _require_robot(robot_id)
    return {
        "base": True,
        "lidar": True,
        "map": True,
        "localization": True,
        "navigation": True,
        "rgbCamera": True,
        "depthCamera": True,
        "arm": True,
        "voice": True,
        # 电池来源未确认，按契约返回 false
        "battery": False,
    }


@router.post("/api/v1/robots/{robot_id}/connection/test")
def test_connection(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    _require_robot(robot_id)
    return {
        "reachable": True,
        "rosbridge": True,
        "rosMaster": True,
        "latencyMs": 18,
        "capabilities": {"base": True, "lidar": True, "camera": True, "navigation": True},
        "checkedAt": time.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
    }


# --------------------------------------------------------------------------- #
# 地图与点位
# --------------------------------------------------------------------------- #
@router.get("/api/v1/robots/{robot_id}/map")
def get_map(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    _require_robot(robot_id)
    return {
        "frameId": "map",
        "resolution": 0.05,
        "width": 0,
        "height": 0,
        "origin": {"x": 0.0, "y": 0.0, "yaw": 0.0},
        # 尚未接入真实 OccupancyGrid，前端使用演示地图
        "data": None,
        "available": False,
    }


@router.get("/api/v1/robots/{robot_id}/waypoints")
def list_waypoints(robot_id: str, current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    _require_robot(robot_id)
    return WAYPOINTS


@router.post("/api/v1/robots/{robot_id}/waypoints", status_code=status.HTTP_201_CREATED)
def create_waypoint(
    robot_id: str, payload: dict[str, Any], current_user: User = Depends(get_current_user)
) -> dict[str, Any]:
    _require_robot(robot_id)
    waypoint = {
        "id": f"wp-{uuid.uuid4().hex[:8]}",
        "name": payload.get("name", "新点位"),
        "code": payload.get("code") or payload.get("name", "waypoint"),
        "x": _to_float(payload.get("x")),
        "y": _to_float(payload.get("y")),
        "yaw": _to_float(payload.get("yaw")),
    }
    WAYPOINTS.append(waypoint)
    return waypoint


@router.patch("/api/v1/robots/{robot_id}/waypoints/{waypoint_id}")
def update_waypoint(
    robot_id: str,
    waypoint_id: str,
    payload: dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    _require_robot(robot_id)
    for index, item in enumerate(WAYPOINTS):
        if item["id"] == waypoint_id:
            updated = {
                **item,
                **{
                    key: value
                    for key, value in payload.items()
                    if key in {"name", "code", "x", "y", "yaw"}
                },
            }
            WAYPOINTS[index] = updated
            return updated
    raise _fail("WAYPOINT_NOT_FOUND", "点位不存在", status.HTTP_404_NOT_FOUND)


@router.delete(
    "/api/v1/robots/{robot_id}/waypoints/{waypoint_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_waypoint(
    robot_id: str, waypoint_id: str, current_user: User = Depends(get_current_user)
) -> None:
    _require_robot(robot_id)
    for index, item in enumerate(WAYPOINTS):
        if item["id"] == waypoint_id:
            WAYPOINTS.pop(index)
            return
    raise _fail("WAYPOINT_NOT_FOUND", "点位不存在", status.HTTP_404_NOT_FOUND)


# --------------------------------------------------------------------------- #
# 导航 / 控制 / 急停
# --------------------------------------------------------------------------- #
@router.post("/api/v1/robots/{robot_id}/navigation/goals", status_code=status.HTTP_202_ACCEPTED)
def create_goal(
    robot_id: str, payload: dict[str, Any], current_user: User = Depends(get_current_user)
) -> dict[str, Any]:
    _require_robot(robot_id)
    if STATE["emergency_stop"]:
        raise _fail("EMERGENCY_STOP_ACTIVE", "急停已触发，请先复位后再导航")
    goal = {
        "x": _to_float(payload.get("x")),
        "y": _to_float(payload.get("y")),
        "yaw": _to_float(payload.get("yaw")),
        "waypointId": payload.get("waypointId"),
    }
    STATE["navigation"] = {"status": "planning", "goal": goal, "distanceRemaining": None}
    return {"goalId": f"nav-{uuid.uuid4().hex[:8]}", "status": "accepted"}


@router.get("/api/v1/robots/{robot_id}/navigation")
def get_navigation(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    _require_robot(robot_id)
    return STATE["navigation"]


@router.delete("/api/v1/robots/{robot_id}/navigation/goals/current")
def cancel_navigation(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    _require_robot(robot_id)
    STATE["navigation"] = {"status": "cancelled", "goal": None, "distanceRemaining": None}
    return {"status": "cancelled"}


@router.post("/api/v1/robots/{robot_id}/control/lease")
def acquire_lease(robot_id: str, current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    """控制权租约：同一时间只允许一个客户端持有。"""
    _require_robot(robot_id)
    if STATE["emergency_stop"]:
        raise _fail("EMERGENCY_STOP_ACTIVE", "急停已触发，无法获取控制权")
    lease = {"leaseId": f"lease-{uuid.uuid4().hex[:8]}", "expiresIn": 15}
    STATE["lease"] = lease
    return lease


@router.post("/api/v1/robots/{robot_id}/emergency-stop")
def trigger_emergency_stop(
    robot_id: str, current_user: User = Depends(get_current_user)
) -> dict[str, Any]:
    """触发软件急停。已登录用户均可触发（故障安全方向）。"""
    _require_robot(robot_id)
    STATE["emergency_stop"] = True
    STATE["lease"] = None
    STATE["navigation"] = {"status": "cancelled", "goal": None, "distanceRemaining": None}
    return {"emergencyStop": True, "message": "已触发软件急停，导航与遥控已拒绝"}


@router.post("/api/v1/robots/{robot_id}/emergency-stop/reset")
def reset_emergency_stop(
    robot_id: str, current_user: User = Depends(get_current_user)
) -> dict[str, Any]:
    """解除软件急停。

    真实部署时应限制为教师/管理员角色，避免无关人员误解除安全状态。
    """
    _require_robot(robot_id)
    STATE["emergency_stop"] = False
    return {"emergencyStop": False, "message": "急停已复位"}


# --------------------------------------------------------------------------- #
# 语音 / 巡检
# --------------------------------------------------------------------------- #
@router.get("/api/v1/robots/{robot_id}/voice/records")
def list_voice_records(
    robot_id: str, current_user: User = Depends(get_current_user)
) -> list[dict[str, Any]]:
    _require_robot(robot_id)
    return STATE["voice_records"]


@router.get("/api/v1/patrol/tasks")
def list_patrol_tasks(current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    return [
        {
            "id": "T20240520001",
            "name": "实验室日常巡检",
            "robotId": "spark-01",
            "status": "running",
            "progress": 40,
            "currentStep": "实验台 B（2 / 5）",
        }
    ]


# --------------------------------------------------------------------------- #
# WebSocket
# --------------------------------------------------------------------------- #
@router.websocket("/ws/v1/robots/{robot_id}")
async def robot_socket(websocket: WebSocket, robot_id: str) -> None:
    """按契约推送机器人状态事件；握手阶段校验令牌。"""
    try:
        authenticate_websocket(websocket)
    except WebSocketException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    def build(seq: int) -> dict[str, Any]:
        return {
            "type": "robot.status",
            "robotId": robot_id,
            "seq": seq,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
            "data": _build_status(),
        }

    await _push_loop(websocket, build)


@router.websocket("/ws/v1/robots/{robot_id}/control")
async def control_socket(websocket: WebSocket, robot_id: str) -> None:
    """遥控通道：安全门禁通过前只做心跳与限速校验，不驱动真实底盘。"""
    try:
        authenticate_websocket(websocket)
    except WebSocketException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_json()
            kind = message.get("type")
            if kind == "teleop.velocity":
                await websocket.send_json(
                    {
                        "type": "teleop.ack",
                        "seq": message.get("seq"),
                        "data": {"accepted": False, "reason": "SAFETY_GATE_NOT_PASSED"},
                    }
                )
            elif kind == "teleop.stop":
                await websocket.send_json({"type": "teleop.stopped", "data": {}})
    except (WebSocketDisconnect, RuntimeError, ValueError, WebSocketException):
        # 连接断开、连接已关闭或收到非法 JSON
        return
