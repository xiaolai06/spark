import { useEffect } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { UNAUTHORIZED_EVENT } from '@/api/client'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LogsPage } from '@/pages/LogsPage'
import { NavigationPage } from '@/pages/NavigationPage'
import { PatrolPage } from '@/pages/PatrolPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RobotsPage } from '@/pages/RobotsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TeleopPage } from '@/pages/TeleopPage'
import { VisionPage } from '@/pages/VisionPage'
import { VoicePage } from '@/pages/VoicePage'
import { useAuthStore } from '@/store/auth'

/** 登录守卫：未登录访问业务页面时跳回登录页 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** 已登录用户访问登录/注册页时直接进入总览 */
function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/**
 * 令牌失效监听。
 *
 * 后端返回 AUTH_TOKEN_INVALID 时，api/client 会清理本地令牌并广播该事件，
 * 这里统一登出并跳回登录页，避免继续以演示数据冒充真实数据。
 */
function UnauthorizedWatcher() {
  const navigate = useNavigate()
  useEffect(() => {
    const onUnauthorized = () => {
      useAuthStore.getState().logout()
      navigate('/login', { replace: true })
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [navigate])
  return null
}

export default function App() {
  return (
    <Router>
      <UnauthorizedWatcher />
      <Routes>
        <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          {/* 第一期：核心六页 */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/robots" element={<RobotsPage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/teleop" element={<TeleopPage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/patrol" element={<PatrolPage />} />

          {/* 第二期：视觉、任务与日志、系统设置 */}
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
