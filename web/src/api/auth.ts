/** 认证接口：对应 /api/v1/auth/* */
import { http, setToken } from './client'
import type { AuthSession, AuthUser } from './types'

export interface RegisterPayload {
  name: string
  email: string
  studentId: string
  password: string
  department?: string
}

export function register(payload: RegisterPayload): Promise<AuthSession> {
  return http.post<AuthSession>(
    '/auth/register',
    { department: '智能控制学院', ...payload },
    { auth: false },
  )
}

export function login(email: string, password: string): Promise<AuthSession> {
  return http.post<AuthSession>('/auth/login', { email, password }, { auth: false })
}

export function fetchMe(): Promise<AuthUser> {
  return http.get<AuthUser>('/auth/me')
}

export function updateProfile(payload: {
  name: string
  studentId: string
  phone: string
  department: string
  role: AuthUser['role']
}): Promise<AuthUser> {
  return http.patch<AuthUser>('/auth/me', payload)
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return http.post<void>('/auth/password', { currentPassword, newPassword })
}

/** 登录/注册成功后统一保存令牌 */
export function persistSession(session: AuthSession): AuthSession {
  setToken(session.token)
  return session
}
