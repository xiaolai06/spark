/**
 * 运行配置。
 *
 * 前端默认指向本机开发后端；部署到机器人 Ubuntu 时通过 .env 覆盖为
 * 机器人地址即可，无需改动业务代码。
 */

/** REST 前缀，对应契约 /api/v1 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://127.0.0.1:8010/api/v1'

/** WebSocket 前缀，对应契约 /ws/v1 */
export const WS_BASE_URL = (
  import.meta.env.VITE_WS_BASE_URL as string | undefined
)?.replace(/\/$/, '') ?? API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v1$/, '/ws/v1')

/** 默认目标机器人 */
export const DEFAULT_ROBOT_ID = 'spark-01'

/** 令牌存储键 */
export const TOKEN_STORAGE_KEY = 'spark.access.token'

/** 用户信息存储键（仅用于首屏快速渲染，真实身份以 /auth/me 为准） */
export const USER_STORAGE_KEY = 'spark.auth.user'

/**
 * 是否启用真实后端。
 * 设置 VITE_USE_MOCK_API=true 可强制使用内置演示数据，方便纯前端演示。
 */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
