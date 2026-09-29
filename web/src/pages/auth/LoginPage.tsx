import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Checkbox, Input } from '@/components/ui/Input'
import { isOk, validateLogin } from '@/lib/validation'
import { useAuthStore } from '@/store/auth'

const DEMO_ACCOUNT = { email: 'student@sparklab.cn', password: 'spark2026' }

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const result = validateLogin({ email, password, remember })
    if (!isOk(result)) {
      setErrors(result.issues)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await login(result.value.email, result.value.password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  function fillDemoAccount() {
    setEmail(DEMO_ACCOUNT.email)
    setPassword(DEMO_ACCOUNT.password)
    setErrors({})
    setFormError(null)
  }

  return (
    <AuthLayout title="欢迎回来" subtitle="登录 Spark 轮足机器人实验平台">
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
          label="邮箱"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          icon={<Mail className="h-4 w-4" aria-hidden />}
          hasIcon
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          disabled={loading}
          autoFocus
        />

        <Input
          label="密码"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="请输入密码"
          icon={<Lock className="h-4 w-4" aria-hidden />}
          hasIcon
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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

        <div className="flex items-center justify-between pt-0.5">
          <Checkbox checked={remember} onChange={setRemember}>
            记住我
          </Checkbox>
          <span className="text-sm text-ink-muted">首期暂不开放找回密码</span>
        </div>

        <Button type="submit" size="lg" block loading={loading} className="mt-2">
          {loading ? '登录中…' : '登 录'}
        </Button>

        <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            演示账号（后端自动创建）
          </p>
          <p className="mt-1 font-mono text-xs text-ink-soft">
            {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
          </p>
          <button
            type="button"
            onClick={fillDemoAccount}
            className="mt-2 text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            一键填入演示账号
          </button>
        </div>

        <p className="pt-1 text-center text-sm text-ink-muted">
          还没有账号？{' '}
          <Link to="/register" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            立即注册
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
