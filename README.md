# Spark 轮足机器人实验平台

```text
D:\desktop\spark
├── docs/      目标接口契约、硬件基线、当前实现盘点与对接方案
├── UI/        页面设计参考图
├── server/    FastAPI 后端（账号体系已真实实现 + 机器人只读接口）
├── web/       React 前端（页面界面已搭建，机器人业务仍有演示占位）
└── logo.png   平台 Logo
```

## 快速启动

需要两个终端。**先起后端，再起前端。**

### 1. 后端

```bash
cd D:\desktop\spark\server
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8010
```

- 接口文档：http://127.0.0.1:8010/docs
- 健康检查：http://127.0.0.1:8010/api/v1/health
- 默认端口 **8010**（本机 8000/8001 常被其他项目占用）

### 2. 前端

```bash
cd D:\desktop\spark\web
npm install
npm run dev
```

默认 5173，被占用时自动顺延（本机通常落在 5175，请以终端输出为准）。

### 演示账号

| 邮箱                   | 密码       |
| ---------------------- | ---------- |
| `student@sparklab.cn`  | `spark2026` |

首次启动后端时自动创建。登录页有「一键填入演示账号」。

> 注意：不要用 `.local` / `.test` 等保留域名做邮箱，pydantic `EmailStr` 会直接拒绝。

## 当前完成度

### 后端（`server/`）

| 模块 | 状态 |
|---|---|
| 注册 / 登录 / 当前用户 / 改资料 / 改密码 | **已真实实现**（SQLAlchemy + SQLite + pbkdf2 加盐哈希 + JWT） |
| 统一错误信封与中文校验提示 | 已实现 |
| 操作日志（登录/注册/改资料/改密码） | 已实现 |
| 机器人列表、详情、状态、能力、连接测试 | 接口已写，返回演示数据；连接测试不探测真机 |
| 点位增删改查、导航状态、急停、控制租约 | 进程内演示状态，不持久化、不产生真实运动 |
| 语音记录、巡检任务列表 | 返回演示记录/任务 |
| WebSocket 状态推送 / 遥控通道 | 推送演示快照；遥控返回 `SAFETY_GATE_NOT_PASSED` |
| 视觉、日志、事件、设置接口 | 未实现（第二期） |

### 前端（`web/`）

业务页面界面已搭建；交互完成度以[当前实现盘点](docs/当前实现盘点与Spark真机对接方案.md)为准：

- 登录、注册、个人资料与密码
- 总览控制台、机器人管理、地图导航、手动遥控、语音交互、巡检任务
- 视觉中心、任务与日志、系统设置（第二期，标注「二期」）

已按方案要求落实的约定：

1. **未知数据显示 `--`**：电池在底盘运行态确认前保持 `--`，不用示例值冒充真实数据。
2. **时间统一在顶部导航**：各页面不再重复显示时间。
3. **页面不放一级标题**：标题由顶栏与卡片承担，避免重复与大小不一。
4. **一屏显示**：所有页面锁定一屏高度，超出部分在面板内部滚动，不出现整页双滚动条。
5. **控制尚未接真机**：页面控制按钮目前主要是本地交互，后端遥控仍拒绝真实速度指令。
6. **来源标识待完善**：顶栏可标识浏览器 Mock；连上演示后端时仍可能显示「实时已连接」，不能据此判断真机在线。

## 目录结构

```text
web/src/
├── api/         按契约封装的接口层（client/types/auth/robots/socket）
├── components/
│   ├── ui/      Button、Input、Select、Checkbox、Card、Badge
│   ├── layout/  AuthLayout、AppLayout（顶栏+侧边栏）、PageShell
│   ├── dashboard/  地图、状态、快捷控制、摄像头、动态、语音
│   └── SparkLogo.tsx
├── lib/         config、format（-- 规则）、validation、utils
├── mock/        内置演示数据
├── pages/       九个页面
└── store/       auth（真实接口）、robot（REST + WebSocket，失败回退 mock）

server/app/
├── main.py      应用入口、异常处理、演示账号种子
├── config.py    端口、令牌、CORS、演示账号
├── security.py  pbkdf2 哈希 + JWT + 当前用户依赖
├── models.py    users、operation_logs
├── schemas.py   请求/响应校验（对外字段固定驼峰）
└── routers/     auth.py、robots.py
```

## 后续接入

1. **真机只读数据**：Ubuntu 上实现 `spark_web_platform`，发布 `/spark_web/status` 等话题，替换后端 `robots.py` 的进程内状态。
2. **地图与视频**：`GET /map` 接入 OccupancyGrid；视频由 `web_video_server` 提供 MJPEG。
3. **安全门禁**：验证软件急停、心跳超时、松手停车、速度上限、控制租约后，才开放真实导航与遥控。
4. **语音联动**：适配 `/voice/stt` 为统一 `voice.transcript` 事件，机器人屏幕与 Web 同步显示。
5. **第二期接口**：Settings、Logs、Events、Vision、Report。

当前功能和真机开发顺序见[实现盘点与对接方案](docs/当前实现盘点与Spark真机对接方案.md)；机器人侧逐文件实施、ROS 代码模板和验收步骤见[机器人端 ROS1 开发与部署说明](docs/Spark机器人端ROS1开发与部署实施说明.md)；目标契约见[最终开发说明](docs/Spark轮足机器人实验平台_最终开发说明.md)。
