/**
 * 表单校验规则。
 *
 * 平台首期不做邮箱验证、短信验证等复杂流程，只保留长度、格式、
 * 一致性和密码强度等本地可判断的规则，便于后续平滑接入后端校验。
 */

export interface FieldIssue {
  message: string
}

export interface ValidationSuccess<T> {
  ok: true
  value: T
}

export interface ValidationFailure {
  ok: false
  issues: Record<string, string>
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

/**
 * 显式类型守卫。
 *
 * 不用 `if (!result.ok)` 直接收窄：未开启 strictNullChecks 时，
 * 布尔字面量判别联合的收窄可能失效，这里用用户自定义守卫保证类型安全。
 */
export function isOk<T>(result: ValidationResult<T>): result is ValidationSuccess<T> {
  return result.ok === true
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^1[3-9]\d{9}$/
const STUDENT_ID_PATTERN = /^\d{8,12}$/

export const PASSWORD_RULES = [
  { id: 'length', label: '至少 8 位', test: (v: string) => v.length >= 8 },
  { id: 'letter', label: '包含字母', test: (v: string) => /[a-zA-Z]/.test(v) },
  { id: 'number', label: '包含数字', test: (v: string) => /\d/.test(v) },
  { id: 'symbol', label: '包含符号', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
] as const

/** 密码强度评分 0-4，用于注册页强度条 */
export function scorePassword(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password) && password.length >= 10) score += 1
  return score
}

export const PASSWORD_STRENGTH_LABEL = ['未输入', '较弱', '一般', '较强', '很强'] as const

/* ------------------------------------------------------------------ */
/* 登录                                                                */
/* ------------------------------------------------------------------ */

export interface LoginInput {
  email: string
  password: string
  remember: boolean
}

export function validateLogin(input: LoginInput): ValidationResult<LoginInput> {
  const issues: Record<string, string> = {}
  const email = input.email.trim()
  const password = input.password

  if (!email) issues.email = '请输入邮箱'
  else if (!EMAIL_PATTERN.test(email)) issues.email = '请输入正确的邮箱地址'

  if (!password) issues.password = '请输入密码'

  if (Object.keys(issues).length > 0) return { ok: false, issues }
  return { ok: true, value: { email, password, remember: input.remember } }
}

/* ------------------------------------------------------------------ */
/* 注册                                                                */
/* ------------------------------------------------------------------ */

export interface RegisterInput {
  name: string
  email: string
  studentId: string
  password: string
  confirmPassword: string
  agree: boolean
}

export function validateRegister(input: RegisterInput): ValidationResult<RegisterInput> {
  const issues: Record<string, string> = {}
  const name = input.name.trim()
  const email = input.email.trim()
  const studentId = input.studentId.trim()

  if (!name) issues.name = '请输入姓名'
  else if (name.length < 2) issues.name = '姓名至少 2 个字符'
  else if (name.length > 20) issues.name = '姓名不能超过 20 个字符'

  if (!email) issues.email = '请输入邮箱'
  else if (!EMAIL_PATTERN.test(email)) issues.email = '请输入正确的邮箱地址'

  if (!studentId) issues.studentId = '请输入学号'
  else if (!STUDENT_ID_PATTERN.test(studentId)) issues.studentId = '学号应为 8-12 位数字'

  if (!input.password) issues.password = '请输入密码'
  else if (input.password.length < 8) issues.password = '密码至少 8 位'
  else if (!/[a-zA-Z]/.test(input.password) || !/\d/.test(input.password)) {
    issues.password = '密码需同时包含字母和数字'
  }

  if (!input.confirmPassword) issues.confirmPassword = '请再次输入密码'
  else if (input.confirmPassword !== input.password) issues.confirmPassword = '两次输入的密码不一致'

  if (!input.agree) issues.agree = '请先阅读并同意平台使用规范'

  if (Object.keys(issues).length > 0) return { ok: false, issues }
  return {
    ok: true,
    value: { name, email, studentId, password: input.password, confirmPassword: input.confirmPassword, agree: true },
  }
}

/* ------------------------------------------------------------------ */
/* 修改资料                                                            */
/* ------------------------------------------------------------------ */

export interface ProfileInput {
  name: string
  email: string
  studentId: string
  phone: string
  department: string
  role: string
}

export function validateProfile(input: ProfileInput, currentEmail: string): ValidationResult<ProfileInput> {
  const issues: Record<string, string> = {}
  const name = input.name.trim()
  const email = input.email.trim()
  const studentId = input.studentId.trim()
  const phone = input.phone.trim()

  if (!name) issues.name = '请输入姓名'
  else if (name.length < 2) issues.name = '姓名至少 2 个字符'
  else if (name.length > 20) issues.name = '姓名不能超过 20 个字符'

  if (!email) issues.email = '请输入邮箱'
  else if (!EMAIL_PATTERN.test(email)) issues.email = '请输入正确的邮箱地址'
  else if (email !== currentEmail) issues.email = '邮箱暂不支持自行修改'

  if (!studentId) issues.studentId = '请输入学号'
  else if (!STUDENT_ID_PATTERN.test(studentId)) issues.studentId = '学号应为 8-12 位数字'

  if (phone && !PHONE_PATTERN.test(phone)) issues.phone = '请输入正确的 11 位手机号'

  if (Object.keys(issues).length > 0) return { ok: false, issues }
  return { ok: true, value: { ...input, name, email, studentId, phone } }
}

/* ------------------------------------------------------------------ */
/* 修改密码                                                            */
/* ------------------------------------------------------------------ */

export interface PasswordInput {
  current: string
  next: string
  confirm: string
}

export function validatePasswordChange(input: PasswordInput): ValidationResult<PasswordInput> {
  const issues: Record<string, string> = {}

  if (!input.current) issues.current = '请输入当前密码'
  if (!input.next) issues.next = '请输入新密码'
  else if (input.next.length < 8) issues.next = '新密码至少 8 位'
  else if (!/[a-zA-Z]/.test(input.next) || !/\d/.test(input.next)) issues.next = '新密码需同时包含字母和数字'
  else if (input.next === input.current) issues.next = '新密码不能与当前密码相同'

  if (!input.confirm) issues.confirm = '请再次输入新密码'
  else if (input.confirm !== input.next) issues.confirm = '两次输入的新密码不一致'

  if (Object.keys(issues).length > 0) return { ok: false, issues }
  return { ok: true, value: input }
}
