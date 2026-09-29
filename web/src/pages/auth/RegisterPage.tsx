import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail, UserRound, X } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/Input'
import {
  PASSWORD_RULES,
  PASSWORD_STRENGTH_LABEL,
  isOk,
  scorePassword,
  validateRegister,
} from '@/lib/validation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const STRENGTH_BAR = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-brand-500', 'bg-emerald-500']
const STRENGTH_TEXT = ['text-ink-muted', 'text-red-500', 'text-amber-600', 'text-brand-600', 'text-emerald-600']

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)

  const [form, setForm] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  })
  const [agree, setAgree] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => scorePassword(form.password), [form.password])

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const result = validateRegister({ ...form, agree })
    if (!isOk(result)) {
      setErrors(result.issues)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await register({
        name: result.value.name,
        email: result.value.email,
        studentId: result.value.studentId,
        password: result.value.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="创建账号" subtitle="注册后即可使用平台全部已开放功能">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <Input
          label="姓名"
          placeholder="请输入真实姓名"
          icon={<UserRound className="h-4 w-4" aria-hidden />}
          hasIcon
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          disabled={loading}
        />

        <Input
          label="邮箱"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          icon={<Mail className="h-4 w-4" aria-hidden />}
          hasIcon
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email}
          disabled={loading}
        />

        <Input
          label="学号"
          inputMode="numeric"
          placeholder="8-12 位数字"
          icon={<UserRound className="h-4 w-4" aria-hidden />}
          hasIcon
          value={form.studentId}
          onChange={(event) => update('studentId', event.target.value)}
          error={errors.studentId}
          disabled={loading}
        />

        <div className="space-y-1.5">
          <Input
            label="密码"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="设置登录密码"
            icon={<Lock className="h-4 w-4" aria-hidden />}
            hasIcon
            value={form.password}
            onChange={(event) => update('password', event.target.value)}
            error={errors.password}
            disabled={loading}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink-soft"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            }
          />

          <div className="flex items-center gap-2 pt-1">
            <div className="flex flex-1 gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors duration-300',
                    index < strength ? STRENGTH_BAR[strength] : 'bg-slate-200',
                  )}
                />
              ))}
            </div>
            <span className={cn('w-14 text-right text-xs font-medium', STRENGTH_TEXT[strength])}>
              {PASSWORD_STRENGTH_LABEL[strength]}
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(form.password)
              return (
                <li
                  key={rule.id}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    passed ? 'text-emerald-600' : 'text-ink-muted',
                  )}
                >
                  {passed ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <X className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {rule.label}
                </li>
              )
            })}
          </ul>
        </div>

        <Input
          label="确认密码"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="请再次输入密码"
          icon={<Lock className="h-4 w-4" aria-hidden />}
          hasIcon
          value={form.confirmPassword}
          onChange={(event) => update('confirmPassword', event.target.value)}
          error={errors.confirmPassword}
          disabled={loading}
        />

        <Checkbox checked={agree} onChange={setAgree} error={errors.agree}>
          我已阅读并同意平台使用规范与实验室安全操作规程
        </Checkbox>

        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          {loading ? '注册中…' : '注 册'}
        </Button>

        <p className="pt-1 text-center text-sm text-ink-muted">
          已有账号？{' '}
          <Link to="/login" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            返回登录
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
