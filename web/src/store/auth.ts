/**
 * 认证状态。
 *
 * 已接入真实后端 /api/v1/auth/*：令牌存 localStorage，请求时由 api/client 自动附加。
 * 刷新页面时先用缓存渲染，再用 /auth/me 校验令牌是否仍然有效。
 */
import { create } from 'zustand'
import * as authApi from '@/api/auth'
import { ApiError, getToken, setToken } from '@/api/client'
import { USER_STORAGE_KEY } from '@/lib/config'
import type { AuthUser } from '@/api/types'

export type UserRole = AuthUser['role']

export const ROLE_LABEL: Record<UserRole, string> = {
  student: '学生用户',
  teacher: '教师用户',
  admin: '平台管理员',
}

function readCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function cacheUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return
  if (user) window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(USER_STORAGE_KEY)
}

/** 把后端错误转成可直接展示的中文提示 */
function toMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

interface AuthState {
  user: AuthUser | null
  /** true 表示会话由真实后端签发 */
  backendReady: boolean
  checking: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: { name: string; email: string; studentId: string; password: string }) => Promise<void>
  updateProfile: (patch: {
    name: string
    studentId: string
    phone: string
    department: string
    role: UserRole
  }) => Promise<void>
  changePassword: (current: string, next: string) => Promise<void>
  logout: () => void
  restore: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: readCachedUser(),
  backendReady: false,
  checking: true,

  login: async (email, password) => {
    const session = authApi.persistSession(await authApi.login(email, password))
    cacheUser(session.user)
    set({ user: session.user, backendReady: true })
  },

  register: async (input) => {
    const session = authApi.persistSession(await authApi.register(input))
    cacheUser(session.user)
    set({ user: session.user, backendReady: true })
  },

  updateProfile: async (patch) => {
    try {
      const user = await authApi.updateProfile(patch)
      cacheUser(user)
      set({ user })
    } catch (error) {
      throw new Error(toMessage(error, '保存失败，请重试'))
    }
  },

  changePassword: async (current, next) => {
    try {
      await authApi.changePassword(current, next)
    } catch (error) {
      throw new Error(toMessage(error, '修改失败，请重试'))
    }
  },

  logout: () => {
    setToken(null)
    cacheUser(null)
    set({ user: null, backendReady: false })
  },

  /** 应用启动或刷新时校验令牌 */
  restore: async () => {
    if (!getToken()) {
      cacheUser(null)
      set({ user: null, checking: false })
      return
    }
    try {
      const user = await authApi.fetchMe()
      cacheUser(user)
      set({ user, backendReady: true, checking: false })
    } catch {
      // 令牌失效：清理本地状态，回到登录页
      setToken(null)
      cacheUser(null)
      set({ user: null, backendReady: false, checking: false })
    }
  },
}))
