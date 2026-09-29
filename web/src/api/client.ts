/**
 * 统一 HTTP 客户端。
 *
 * - 自动附加 Authorization: Bearer <token>
 * - 统一解析后端错误信封 {"error": {"code","message","details"}}
 * - 抛出 ApiError，页面层只处理 message/code，不关心 HTTP 细节
 */
import { API_BASE_URL, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/lib/config'

/** 令牌失效时广播，由应用层统一处理登出与跳转 */
export const UNAUTHORIZED_EVENT = 'spark:unauthorized'

export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details: Record<string, unknown>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || '请求失败，请稍后重试')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.details = body.details ?? {}
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** 鉴权接口本身不需要 token */
  auth?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8'

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, {
      code: 'NETWORK_UNAVAILABLE',
      message: '无法连接后端服务，请确认已启动 server 目录下的 FastAPI',
    })
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  // 后端异常时可能返回 HTML 错误页而非 JSON，这里不能直接 JSON.parse
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const envelope = (payload as { error?: ApiErrorBody } | null)?.error
    if (envelope) {
      // 只在「令牌本身无效」时清理会话；
      // 登录接口的 INVALID_CREDENTIALS 属于表单校验错误，不能跳转。
      if (response.status === 401 && envelope.code === 'AUTH_TOKEN_INVALID') {
        setToken(null)
        window.localStorage.removeItem(USER_STORAGE_KEY)
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
      }
      throw new ApiError(response.status, envelope)
    }
    throw new ApiError(response.status, {
      code: `HTTP_${response.status}`,
      message: response.status === 404 ? '接口不存在，请确认后端版本与前端契约一致' : '请求失败，请稍后重试',
    })
  }

  return payload as T
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
