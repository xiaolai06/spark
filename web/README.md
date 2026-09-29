# Spark 轮足机器人实验平台 · Web 前端

React + TypeScript + Vite + Tailwind CSS v4。账号相关接口已接入后端数据库。机器人数据按
《最终开发说明》第 7 节契约封装；当前后端自身也返回演示快照，后端不可用时前端会回退内置演示数据。功能完成度见[当前实现盘点](../docs/当前实现盘点与Spark真机对接方案.md)。

## 启动

```bash
npm install
npm run dev
```

默认 5173；被占用时 Vite 自动顺延（本机通常为 5175，以终端输出为准）。

```bash
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览构建产物
```

后端需先启动（见根目录 `README.md`），默认 `http://127.0.0.1:8010/api/v1`。

## 环境变量

| 变量                | 默认值                          | 说明                         |
| ------------------- | ------------------------------- | ---------------------------- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8010/api/v1`  | 后端 REST 前缀               |
| `VITE_WS_BASE_URL`  | 由 API 地址推导                  | WebSocket 前缀               |
| `VITE_USE_MOCK_API` | `false`                          | 设为 `true` 强制只用演示数据 |

## 演示账号

| 邮箱                  | 密码       |
| --------------------- | ---------- |
| `student@sparklab.cn` | `spark2026` |

由后端首次启动时自动创建。

## 页面

| 路由          | 页面           | 阶段 |
| ------------- | -------------- | ---- |
| `/login`      | 登录           | 一期 |
| `/register`   | 注册           | 一期 |
| `/dashboard`  | 总览控制台     | 一期 |
| `/robots`     | 机器人管理     | 一期 |
| `/navigation` | 地图导航       | 一期 |
| `/teleop`     | 手动遥控       | 一期 |
| `/voice`      | 语音交互       | 一期 |
| `/patrol`     | 巡检任务       | 一期 |
| `/profile`    | 个人资料与密码 | 一期 |
| `/vision`     | 视觉中心       | 二期 |
| `/logs`       | 任务与日志     | 二期 |
| `/settings`   | 系统设置       | 二期 |

## 目录结构

```text
src/
├── api/
│   ├── client.ts     fetch 封装、令牌注入、统一错误信封解析
│   ├── types.ts      契约类型（驼峰，null 表示无真实来源）
│   ├── auth.ts       /auth/register、/login、/me、/password
│   ├── robots.ts     机器人、点位、导航、急停、租约、语音、巡检
│   └── socket.ts     WebSocket 订阅与退避重连
├── components/
│   ├── ui/           Button、Input、Select、Checkbox、Card、Badge
│   ├── layout/       AuthLayout、AppLayout、PageShell（统一容器与面板）
│   ├── dashboard/    MapPanel、StatusPanel、QuickControlPanel、CameraPanel、ActivityPanel
│   └── SparkLogo.tsx
├── lib/
│   ├── config.ts     接口地址与开关
│   ├── format.ts     空值统一「--」、时间与单位格式化
│   ├── validation.ts 登录/注册/改资料/改密码本地校验
│   └── utils.ts      className 合并
├── mock/             内置演示数据（后端不可用时回退）
├── pages/            九个页面
└── store/
    ├── auth.ts       真实后端会话，令牌存 localStorage
    └── robot.ts      REST 拉取 + WebSocket 推送，失败回退 mock
```

## 关键约定

1. **未知数据显示 `--`**：`src/lib/format.ts` 统一处理 `null`，不使用示例值冒充真实数据。
2. **时间只在顶栏**：各页面不重复显示时间，也不放页面级一级标题。
3. **一屏显示**：`PageShell` 锁定一屏高度，内容超出时面板内部滚动。
4. **统一规格**：面板标题栏固定高度 `h-11`，间距统一 `gap-3`。
5. **来源标识待完善**：顶栏目前能区分内置 Mock 与后端连接；连上演示后端仍可能显示「实时已连接」，不能据此判断真机在线。
6. **控制类操作不产生真实运动**：快捷控制与遥控页面主要是本地交互，后端控制通道仍拒绝真实速度命令。
