# Spark 轮足机器人实验平台：最终开发说明

> 版本：V1.0  
> 日期：2026-09-29  
> 状态：目标架构与接口契约。本文整合硬件采集、Web 状态展示、接口设计、UI 参考和开发决策；代码现状请以[当前实现盘点与 Spark 真机对接方案](当前实现盘点与Spark真机对接方案.md)为准。

## 1. 文档用途与事实分级

本文用于指导 Spark 轮足机器人实验平台的 UI、FastAPI、ROS 适配和真机联调。工作区现已有 `web/` 和 `server/` 源码；实现程度、演示数据边界和待办事项见[当前实现盘点](当前实现盘点与Spark真机对接方案.md)。本文中的设计契约不能直接视为已实现或已通过真机验证。

信息按以下三级使用：

- **已确认**：来自机器人采集报告、已观察接口或用户明确确认。
- **设计契约**：为项目统一约定的接口和实现规则，编码时必须遵守。
- **待真机确认**：有合理预期，但在运行时核对前不得写死或当成验收事实。

采集快照和 UI 示例都不是实时默认值。接口拿不到真实数据时返回 `null`，前端显示“--”。

## 2. 已确认的机器人基线

目标机器人是 NXROBO Spark 系列 ROS 教学平台，当前按以下实机环境开发：

- 系统：Ubuntu 20.04.5 LTS，Linux 5.15，x86_64。
- ROS：ROS1 Noetic。UI 中出现的 ROS2 Humble 仅是示例数据，不代表目标实机。
- 主控：Intel NUC8i5BEK，主板 Intel NUC8BEB。
- CPU：Intel Core i5-8259U，4 核 8 线程，基础频率 2.30 GHz，最高 3.80 GHz。
- 内存：约 8 GB，采集时可见约 7.6 GiB，无 Swap。
- 存储：Kingchuxing 128 GB SSD，采集时约 48 GB 已用、57 GB 可用。
- GPU：Intel Iris Plus Graphics 655，无 NVIDIA GPU、CUDA 或 TensorRT。
- 相机：Intel RealSense D435，USB 3.2，固件 05.12.14.50，提供 RGB、Depth 和双红外。
- 底盘接口：CH340 串口，稳定路径 `/dev/sparkBase`。
- 雷达接口：CP2102 串口，稳定路径 `/dev/ydlidar`；系统有 YDLIDAR G6/G2 软件支持，实体型号待铭牌或运行参数确认。
- 网络：Intel Wireless-AC 9560 与 Intel I219-V 千兆网卡。
- 触控显示：机身屏幕已安装，USB 触控控制器为 D-WAV WS170120；面板尺寸和分辨率未确认。
- 机械臂：实体机械臂及 MoveIt 环境存在，但具体型号和真实驱动待确认。

采集时 IP 为 `192.168.3.18`，CPU Package 温度为 54°C，内存约 2.7/7.6 GB（41.5%），磁盘约 48/109 GB（46%）。这些是当时快照，不能硬编码。RAM 没有独立温度传感器，不显示 RAM 温度。

机器人已安装 `spark_base`、`spark_navigation`、`spark_slam`、`spark_voice` 等 ROS 软件。用户确认本机具备语音识别，并已观察到 `/voice/stt` 和 `/voice/tts`；消息字段、置信度、状态和屏幕显示入口仍需运行时确认。

Spark Base 源码存在电压、电流、温度、电量、容量及充电状态相关字段，历史代码还引用过 `/battery/volume` 和 `/battery/charge`。上次采集时底盘节点未完整启动，因此电池真实输出仍待确认。

## 3. 硬件能力与约束

机器人适合 ROS 教学、SLAM、室内导航、Web 控制、D435 RGB-D、OpenCV、基础视觉、巡检和机械臂教学。约 8 GB 内存且无 NVIDIA GPU，因此不把大型 YOLO、Whisper Large、大语言模型、CUDA 或 TensorRT 作为本机实时能力。

首期优先复用现有语音识别。视觉模型先做轻量化或外部推理评估；外部推理结果仍应返回统一后端，再同步到 Web 和机器人屏幕。机器人端避免同时运行多个重型浏览器、RViz、深度学习进程和 Docker 容器，并至少保留约 20 GB 磁盘空间。

稳定设备路径必须使用 `/dev/sparkBase` 和 `/dev/ydlidar`，不能依赖可能变化的 `/dev/ttyUSB0`、`/dev/ttyUSB1`。D435 应保持 USB 3.x；掉线或帧率下降时先检查 USB 拓扑。

## 4. 项目目标与已确认开发决策

项目目标是完成：

**机器人接入 → 状态监控 → 地图定位 → 导航/遥控 → 本机语音展示 → 巡检任务 → 后续视觉、日志和报告。**

已确认决策：

- 首期先做 UI + Mock，再接 FastAPI，最后接 Ubuntu 真机。
- 首期六页：总览、机器人管理、地图导航、手动遥控、语音交互、巡检任务。
- 第二期三页：视觉中心、任务与日志、系统设置。
- Windows 运行前端开发和浏览器；Spark Ubuntu 运行 ROS1、硬件驱动、语音和真实控制后端。
- 用户可安排 Windows 与机器人处于同一局域网联调。
- 危险控制在安全门禁通过前保持 Mock 或禁用，不能误连真实底盘。

## 5. 最终架构

```text
Windows 浏览器 / 机器人触控屏
        │ HTTP + WebSocket
        ▼
FastAPI (/api/v1, /ws/v1)
  鉴权、控制租约、限速、任务、日志、SQLite
        │ rosbridge / roslibpy（仅本机或可信内网）
        ▼
spark_web_platform
  状态适配、语音适配、导航桥、安全 Watchdog
        │ topic_mapping.yaml
        ▼
Spark ROS1 Noetic
  底盘、雷达、D435、定位、导航、语音、机械臂
```

职责边界：

- React 只调用 Web API，负责展示、交互和地图渲染。
- FastAPI 提供稳定业务接口，执行参数校验、权限、控制租约和速度限制。
- `spark_web_platform` 屏蔽厂家 Topic 差异，并在机器人端执行最终超时停车。
- 厂家 ROS 驱动尽量不修改；原始 Topic 只出现在 Ubuntu 适配层配置中。
- 浏览器禁止直接向 `/cmd_vel` 发布速度，rosbridge 不暴露公网。
- 机器人触控屏浏览器与 ROSBridge 若在同一台机器，`127.0.0.1` 监听仍可被浏览器访问；真实控制必须再通过认证和进程/网络隔离，具体实施门禁见[机器人端 ROS1 说明](Spark机器人端ROS1开发与部署实施说明.md)。

开发时 Vite 可运行在 Windows，通过当前局域网地址访问 Ubuntu API。生产时前端构建为静态文件，由 Ubuntu 上的 FastAPI 或 Nginx 提供；Windows 与机器人屏幕访问同一地址。

## 6. 页面范围与信息放置

### 6.1 首期六页

| 页面 | 首期内容 | UI 参考 |
|---|---|---|
| 总览控制台 | 地图、位置、路径、目标、模式、任务、速度、导航状态、摄像头预览、最近事件和语音入口 | `UI/01-dashboard.png` |
| 机器人管理 | 机器人列表、连接测试、设备详情、系统资源、电源、传感器和 ROS 诊断 | `UI/02-robot-management.png` |
| 地图导航 | 地图、位姿、朝向、路径、目标距离、导航状态、预设点位及点位管理 | `UI/03-map-navigation.png` |
| 手动遥控 | 视频、小地图、设定速度与实际速度、安全状态、虚拟方向键和急停 | `UI/04-teleoperation.png` |
| 语音交互 | 本机识别文本、状态、置信度、意图、历史和执行反馈 | `UI/05-voice-interaction.png` |
| 巡检任务 | 路线、检查项、当前点、进度、异常、暂停/恢复/取消 | `UI/06-patrol-tasks.png` |

### 6.2 第二期三页

- 视觉中心：RGB/Depth、检测框、类别、置信度、统计、快照和 FPS，参考 `UI/07-vision-center.png`。
- 任务与日志：历史任务、异常、报告、图片和操作日志；暂无独立 UI 图。
- 系统设置：ROSBridge、视频服务、心跳、安全超时、速度上限、语音、视觉阈值和通知，参考 `UI/09-system-settings.png`。

### 6.3 统一展示规则

- Header 只放在线、电量、网络和告警；电量未确认时显示“--”。
- 不在 Header 长期放置 CPU、内存、IP、ROS Topic、速度或坐标。
- 总览放当前任务和关键运行状态。
- 导航页放位姿、朝向、速度、目标、距离、路径和点位。
- 遥控页必须区分设定速度与实际速度，并显示急停、底盘和网络延迟。
- 电压、电流、电池温度、CPU 温度、内存和磁盘只放机器人管理的设备详情。
- 巡检启动前检查在线、电量、导航、雷达和相机；电量未确认时明确显示未确认，不阻止 Mock 演示，但阻止真实自动执行。
- CPU/内存仅在视觉中心的高级调试模式显示。

## 7. 统一状态与接口契约

### 7.1 RobotStatus

后端统一维护状态，建议核心结构如下：

```json
{
  "robotId": "spark-01",
  "online": true,
  "mode": "navigation",
  "network": {"ip": null, "latencyMs": null, "status": "unknown"},
  "system": {
    "cpuUsage": null,
    "cpuTemperature": null,
    "memoryUsedGb": null,
    "memoryTotalGb": null,
    "memoryUsage": null,
    "diskUsedGb": null,
    "diskTotalGb": null,
    "diskUsage": null,
    "uptimeSeconds": null
  },
  "power": {
    "percentage": null,
    "voltage": null,
    "current": null,
    "temperature": null,
    "chargingStatus": "unknown"
  },
  "motion": {"linearVelocity": null, "angularVelocity": null},
  "pose": {"x": null, "y": null, "yaw": null},
  "sensors": {},
  "navigation": {},
  "task": {}
}
```

设备状态使用 `online`、`offline`、`warning`、`error`、`unknown`。任务状态使用 `pending`、`running`、`paused`、`success`、`failed`、`cancelled`。导航状态使用 `idle`、`planning`、`moving`、`success`、`failed`、`cancelled`。充电状态使用 `not_charging`、`charging`、`full`、`unknown`。

时间使用带时区的 ISO 8601。距离单位为米，线速度为 m/s，角速度为 rad/s；ROS 内部角度为弧度，UI 显示为度。电量使用 0–100 或 `null`。

### 7.2 Web API

统一前缀为 `/api/v1` 和 `/ws/v1`。

首期契约：

```text
GET    /api/v1/robots
GET    /api/v1/robots/{robotId}
GET    /api/v1/robots/{robotId}/status
GET    /api/v1/robots/{robotId}/capabilities
POST   /api/v1/robots/{robotId}/connection/test

GET    /api/v1/robots/{robotId}/map
GET    /api/v1/robots/{robotId}/waypoints
POST   /api/v1/robots/{robotId}/waypoints
PATCH  /api/v1/robots/{robotId}/waypoints/{waypointId}
DELETE /api/v1/robots/{robotId}/waypoints/{waypointId}

POST   /api/v1/robots/{robotId}/navigation/goals
GET    /api/v1/robots/{robotId}/navigation
DELETE /api/v1/robots/{robotId}/navigation/goals/current

POST   /api/v1/robots/{robotId}/control/lease
POST   /api/v1/robots/{robotId}/emergency-stop
POST   /api/v1/robots/{robotId}/emergency-stop/reset

GET    /api/v1/robots/{robotId}/voice/records
WS     /ws/v1/robots/{robotId}
WS     /ws/v1/robots/{robotId}/control
```

巡检接口可以先实现数据和状态：

```text
POST /api/v1/patrol/tasks
GET  /api/v1/patrol/tasks
POST /api/v1/patrol/tasks/{taskId}/runs
POST /api/v1/patrol/runs/{runId}/pause
POST /api/v1/patrol/runs/{runId}/resume
POST /api/v1/patrol/runs/{runId}/cancel
```

第二期补充相机、视觉检测、日志、事件、报告、设置、语音命令执行、电源详情和机械臂接口。

错误响应统一为：

```json
{"error": {"code": "ROBOT_OFFLINE", "message": "Robot is offline", "details": {}}}
```

首批错误码包括 `ROBOT_NOT_FOUND`、`ROBOT_OFFLINE`、`ROS_DISCONNECTED`、`ROS_TOPIC_UNAVAILABLE`、`CONTROL_LEASE_REQUIRED`、`CONTROL_LEASE_CONFLICT`、`EMERGENCY_STOP_ACTIVE`、`NAVIGATION_NOT_READY`、`NAVIGATION_FAILED`、`LIDAR_OFFLINE`、`CAMERA_OFFLINE`、`BATTERY_DATA_UNAVAILABLE`、`TASK_NOT_FOUND`、`TASK_CONFLICT`。

### 7.3 WebSocket 与刷新

实时包统一包含 `type`、`robotId`、`seq`、`timestamp` 和 `data`。首期事件类型为：

```text
robot.status
robot.pose
robot.velocity
power.status
sensor.health
navigation.status
navigation.path
task.status
voice.transcript
system.alert
```

刷新频率：

| 数据 | 频率 |
|---|---:|
| 位姿、速度 | 5–10 Hz |
| 导航状态 | 2–5 Hz |
| 全局路径 | 1–5 Hz 或变化时推送 |
| 电池 | 0.5–1 Hz |
| CPU、内存、温度 | 1 Hz |
| 磁盘 | 10–30 秒 |
| 网络延迟 | 1–3 秒 |
| 在线、传感器健康 | 1 Hz |
| 摄像头 | 15–30 FPS |

高频位姿、速度和视频不全部落库；任务、事件、语音记录和操作日志持久化。地图较小时可返回 JSON，大地图优先使用 PNG 或压缩二进制加元数据。

## 8. ROS 适配与数据来源

所有原始 Topic 放入 `config/topic_mapping.yaml`。下列名称是 ROS 常规预期，不是已经全部实机确认的最终值：

```yaml
base:
  cmd_vel: /cmd_vel
  odom: /odom
localization:
  pose: /amcl_pose
map:
  topic: /map
lidar:
  scan: /scan
navigation:
  action: /move_base
  global_plan: /move_base/GlobalPlanner/plan
camera:
  rgb: /camera/color/image_raw
  depth: /camera/depth/image_rect_raw
  info: /camera/color/camera_info
arm:
  joint_states: /joint_states
voice:
  stt: /voice/stt
  tts: /voice/tts
```

项目自定义接口统一使用 `/spark_web/*`：

- `/spark_web/status`：综合在线、模式、系统、传感器和任务状态。
- `/spark_web/pose`：`x/y/theta`，来源优先为 AMCL，也可由 `map -> base_link` TF 得到。
- `/spark_web/velocity`：实际线速度和角速度。
- `/spark_web/diagnostics`：底盘、雷达、相机、导航、机械臂、语音和网络诊断。
- `/spark_web/teleop/cmd_vel` 与 `/spark_web/teleop/heartbeat`：遥控命令和心跳。
- `/spark_web/emergency_stop` 与 reset：软件急停及受控复位。
- `/spark_web/task_status`、`/spark_web/event`：任务和异常事件。
- `/spark_web/voice/transcript`：由 `/voice/stt` 转换的统一语音事件。
- `/spark_web/power`：电池真实来源确认后再启用。

数据来源固定为：

- 位姿、速度、雷达、导航、机械臂、语音：ROS。
- 电池：Spark Base 适配层；未确认前全部返回 `null`。
- CPU、内存、磁盘、IP、运行时间：Linux `/proc`、psutil、网络接口和传感器接口。
- 视频：ROS Image 经 `web_video_server` 提供 HTTP 流，不通过 rosbridge 传输原始图像 JSON。
- 点位、巡检、日志和报告：FastAPI + SQLite。

正式导航使用 `move_base` Action，以获得接受、执行、成功、失败和取消状态；不把 `/move_base_simple/goal` 作为正式业务接口。

## 9. 语音、巡检与安全

### 9.1 语音

```text
机器人音频输入 → 现有 spark_voice → /voice/stt
                                      ├→ 机器人本机显示
                                      └→ voice adapter → /spark_web/voice/transcript
                                                           → FastAPI/WebSocket → Web
```

语音事件至少包含 `eventId`、`robotId`、`source`、时间、文本、是否最终结果、置信度、识别状态、意图和执行状态。机器人输入标记 `source=robot`，浏览器输入标记 `source=web`。

首期实现转写、状态、历史和两端展示。意图解析与命令执行必须经过唯一任务入口；网络重连可以补历史，但禁止重放旧语音命令。

### 9.2 巡检

巡检状态机由后端或 ROS 适配层维护，前端只负责创建、启动、暂停、恢复、取消和查看：

```text
IDLE → PREPARE → NAVIGATING → ARRIVED → INSPECTING → RECORDING
                                                   → NEXT_POINT
                                                   → RETURN_HOME
                                                   → COMPLETED
```

旁路状态为 `PAUSED`、`FAILED`、`CANCELLED`、`EMERGENCY_STOP`。每次转换都校验当前状态并记录步骤。真实自动巡检只有在导航、急停、断连停车和必要健康检查通过后启用。

### 9.3 安全门禁

真实速度命令采用：

```text
浏览器 → FastAPI 校验 → /spark_web/teleop/*
      → 机器人端 Safety Watchdog → /cmd_vel → Spark Base
```

启用真实控制前必须通过：

- 软件急停拒绝导航、遥控和巡检，并持续发布零速度。
- 松开按钮、页面关闭、WebSocket 断开、心跳超时均停车。
- 心跳建议 500 ms 超时，且包含时间戳、租约 ID 和序号。
- 控制租约防止多个客户端同时控制。
- 服务端执行最大线速度和角速度限制。
- 低速真机测试通过，硬件急停独立可用。

软件急停不能替代硬件急停。

## 10. 数据持久化与工程结构

SQLite 首期建议包含 `robots`、`maps`、`waypoints`、`patrol_tasks`、`patrol_points`、`task_runs`、`task_steps`、`events`、`logs`、`voice_records`、`settings`。第二期增加 `detections`、`snapshots` 和报告数据。语音默认只保存文本、状态和执行结果；原始音频是否保存需单独确认。

机器人运行数据建议放在 `/home/spark/spark_platform_data/` 下的 `maps`、`patrol`、`images`、`reports`、`logs`、`database`，不要散落在 ROS 源码目录。

建议工程边界：

```text
web/                 React + TypeScript + Vite
server/              FastAPI、SQLite、WebSocket、服务层
spark_web_platform/  ROS1 Python 适配、消息、配置、Launch
```

React 页面不得散落创建 `ROSLIB.Topic`。ROS 连接集中在 FastAPI 的适配服务或 Ubuntu 端桥接节点。

## 11. 开发顺序与验收

1. 定义 TypeScript/Pydantic 契约、Mock 数据和六页路由。
2. 完成六页可交互 UI；未知值显示“--”，Mock 模式有明确标识。
3. 完成 FastAPI、SQLite、WebSocket 和 Mock RobotAdapter，并替换页面临时数据。
4. 在 Ubuntu 运行时核对 Topic、TF、语音消息、电池和当前 IP，填写映射配置。
5. 接入只读真实状态，验证断线、重连、空值和延迟。
6. 完成安全门禁及低速测试后，依次启用导航、遥控和巡检执行。
7. 第二期实现视觉、日志、设置、报告、电源详情和机械臂。

首期验收：

- 六页可在 Mock 与真实数据源之间切换。
- Header、总览、导航、遥控和设备详情没有重复堆叠无关数据。
- 在线、系统资源、地图和位姿可显示；无数据时不伪造。
- 本机语音转写可在机器人端和 Web 查看，且不会重复执行。
- 安全门禁完成前，任何 UI 操作都不能驱动真实底盘。
- 门禁完成后，松开、断连、超时、取消和急停均能停车。

## 12. 真机核对清单

编码前或首次联调时核对：

- `rostopic list` 中地图、定位、里程计、雷达、相机、导航和路径的真实名称及消息类型。
- `map -> base_link` TF 是否可用，位姿来源选择 AMCL 还是 TF。
- `/voice/stt`、`/voice/tts` 的消息定义、最终结果标识、置信度和屏幕显示方式。
- Spark Base 是否实际发布电池百分比、电压、电流、温度和充电状态。
- 雷达铭牌或启动参数、机械臂真实驱动、D435 是否仍为 USB 3.x。
- Windows 到机器人当前 IP 的 HTTP/WebSocket 连通性、端口和访问控制。
- 最大速度、硬件急停、失联停车和恢复操作流程。

## 13. 当前明确不做的承诺

- 不承诺 ROS2 Humble 兼容。
- 不承诺四路物理摄像头；实机目前确认一台 D435。
- 不承诺电池、雷达实体型号、机械臂型号已经最终确认。
- 不承诺大型视觉或语音模型能在 NUC 上实时运行。
- 不承诺软件急停可替代硬件急停。
- 当前虽有前后端实现代码，但没有本次真机联调与安全验收报告；具体完成度见当前实现盘点。
