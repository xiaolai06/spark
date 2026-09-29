import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Badge, Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { isOk, validatePasswordChange, validateProfile } from '@/lib/validation'
import { ROLE_LABEL, useAuthStore } from '@/store/auth'
import type { UserRole } from '@/store/auth'
import { formatDate } from '@/lib/format'

type Feedback = { tone: 'success' | 'danger'; text: string } | null

const FEEDBACK_STYLE = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
} as const

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const changePassword = useAuthStore((state) => state.changePassword)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    studentId: user?.studentId ?? '',
    phone: user?.phone ?? '',
    department: user?.department ?? '',
    role: (user?.role ?? 'student') as UserRole,
  })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  // 必须在所有 useState 之后、事件处理函数之前守卫：
  // 处理函数声明会被提升，若守卫在其后，闭包内拿到的 user 仍是可空类型。
  if (!user) return null
  const currentUser = user

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileFeedback(null)
    const result = validateProfile(profile, currentUser.email)
    if (!isOk(result)) {
      setProfileErrors(result.issues)
      return
    }
    setProfileErrors({})
    setSavingProfile(true)
    try {
      await updateProfile({
        name: result.value.name,
        studentId: result.value.studentId,
        phone: result.value.phone,
        department: result.value.department,
        role: result.value.role as UserRole,
      })
      setProfileFeedback({ tone: 'success', text: '资料已保存' })
    } catch (error) {
      setProfileFeedback({
        tone: 'danger',
        text: error instanceof Error ? error.message : '保存失败，请重试',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordFeedback(null)
    const result = validatePasswordChange(passwords)
    if (!isOk(result)) {
      setPasswordErrors(result.issues)
      return
    }
    setPasswordErrors({})
    setSavingPassword(true)
    try {
      await changePassword(result.value.current, result.value.next)
      setPasswords({ current: '', next: '', confirm: '' })
      setPasswordFeedback({ tone: 'success', text: '密码已修改，请牢记新密码' })
    } catch (error) {
      setPasswordErrors({
        current: error instanceof Error ? error.message : '修改失败，请重试',
      })
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">个人资料与密码</h2>
          <p className="mt-1 text-sm text-ink-muted">
            管理账号基础信息与登录密码。当前为前端演示环境，数据仅保存在本机浏览器。
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          退出登录
        </Button>
      </header>

      {/* 账号概览 */}
      <Card>
        <CardBody className="flex flex-wrap items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
            {user.name.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
              {user.name}
              <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IdCard className="h-3.5 w-3.5" aria-hidden />
                学号 {user.studentId}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                注册于 {user.createdAt.slice(0, 10)}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-line-strong bg-slate-50 px-4 py-3 text-xs text-ink-muted">
            今日 <span className="font-semibold text-ink-soft">{formatDate(new Date())}</span>
            <br />
            账号状态 <span className="font-semibold text-emerald-600">正常</span>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* 修改资料 */}
        <Card>
          <CardHeader
            icon={<UserRound className="h-4 w-4" aria-hidden />}
            title="修改资料"
            description="姓名、学号、院系和角色可自行维护"
          />
          <CardBody>
            <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
              {profileFeedback ? (
                <div
                  role="status"
                  className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${
                    FEEDBACK_STYLE[profileFeedback.tone]
                  }`}
                >
                  {profileFeedback.tone === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span>{profileFeedback.text}</span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="姓名"
                  value={profile.name}
                  onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                  error={profileErrors.name}
                  icon={<UserRound className="h-4 w-4" aria-hidden />}
                  hasIcon
                />
                <Input
                  label="学号"
                  value={profile.studentId}
                  onChange={(event) => setProfile((prev) => ({ ...prev, studentId: event.target.value }))}
                  error={profileErrors.studentId}
                  icon={<IdCard className="h-4 w-4" aria-hidden />}
                  hasIcon
                />
                <Input
                  label="邮箱"
                  value={profile.email}
                  onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                  error={profileErrors.email ?? profileErrors.email}
                  hint="首期暂不支持自行修改邮箱"
                  icon={<Mail className="h-4 w-4" aria-hidden />}
                  hasIcon
                />
                <Input
                  label="手机号"
                  value={profile.phone}
                  placeholder="选填，11 位手机号"
                  onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                  error={profileErrors.phone}
                  icon={<Phone className="h-4 w-4" aria-hidden />}
                  hasIcon
                />
                <Input
                  label="院系"
                  value={profile.department}
                  onChange={(event) => setProfile((prev) => ({ ...prev, department: event.target.value }))}
                  error={profileErrors.department}
                  icon={<BadgeCheck className="h-4 w-4" aria-hidden />}
                  hasIcon
                />
                <Select
                  label="账号角色"
                  value={profile.role}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, role: event.target.value as UserRole }))
                  }
                  error={profileErrors.role}
                  options={[
                    { value: 'student', label: ROLE_LABEL.student },
                    { value: 'teacher', label: ROLE_LABEL.teacher },
                    { value: 'admin', label: ROLE_LABEL.admin },
                  ]}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setProfile({
                      name: user.name,
                      email: user.email,
                      studentId: user.studentId,
                      phone: user.phone,
                      department: user.department,
                      role: user.role,
                    })
                    setProfileErrors({})
                    setProfileFeedback(null)
                  }}
                >
                  重置
                </Button>
                <Button type="submit" loading={savingProfile} icon={<Save className="h-4 w-4" aria-hidden />}>
                  {savingProfile ? '保存中…' : '保存修改'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* 修改密码 */}
        <Card>
          <CardHeader
            icon={<KeyRound className="h-4 w-4" aria-hidden />}
            title="修改密码"
            description="新密码需至少 8 位，且同时包含字母和数字"
          />
          <CardBody>
            <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
              {passwordFeedback ? (
                <div
                  role="status"
                  className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${
                    FEEDBACK_STYLE[passwordFeedback.tone]
                  }`}
                >
                  {passwordFeedback.tone === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span>{passwordFeedback.text}</span>
                </div>
              ) : null}

              <Input
                label="当前密码"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="current-password"
                value={passwords.current}
                onChange={(event) => setPasswords((prev) => ({ ...prev, current: event.target.value }))}
                error={passwordErrors.current}
                icon={<Lock className="h-4 w-4" aria-hidden />}
                hasIcon
              />
              <Input
                label="新密码"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={passwords.next}
                onChange={(event) => setPasswords((prev) => ({ ...prev, next: event.target.value }))}
                error={passwordErrors.next}
                icon={<Lock className="h-4 w-4" aria-hidden />}
                hasIcon
              />
              <Input
                label="确认新密码"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(event) => setPasswords((prev) => ({ ...prev, confirm: event.target.value }))}
                error={passwordErrors.confirm}
                icon={<Lock className="h-4 w-4" aria-hidden />}
                hasIcon
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPasswords((value) => !value)}
                    aria-label={showPasswords ? '隐藏密码' : '显示密码'}
                    className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink-soft"
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4" aria-hidden />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                }
              />

              <div className="rounded-xl border border-dashed border-line-strong bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
                <p className="flex items-center gap-1.5 font-medium text-ink-soft">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  实验室账号安全建议
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                  <li>不要与他人共用账号，任务日志需可追溯到具体操作人</li>
                  <li>离开实验室前退出登录并关闭浏览器</li>
                  <li>发现异常登录记录请立即修改密码</li>
                </ul>
              </div>

              <div className="flex items-center justify-end pt-1">
                <Button
                  type="submit"
                  loading={savingPassword}
                  icon={<KeyRound className="h-4 w-4" aria-hidden />}
                >
                  {savingPassword ? '提交中…' : '确认修改'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      <p className="text-center text-xs text-ink-muted">
        需要查看平台整体状态？{' '}
        <Link to="/dashboard" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
          返回总览控制台
        </Link>
      </p>
    </div>
  )
}
