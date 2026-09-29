import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BatteryCharging,
  Bot,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  Video,
  Wifi,
  X,
} from 'lucide-react'
import { SparkLogo } from '@/components/SparkLogo'
import { Badge } from '@/components/ui/Card'
import { formatClock, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ROLE_LABEL, useAuthStore } from '@/store/auth'
import { useRobotStore } from '@/store/robot'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  phase2?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: '总览控制台', icon: LayoutDashboard },
  { to: '/robots', label: '机器人管理', icon: Bot },
  { to: '/navigation', label: '地图导航', icon: MapPinned },
  { to: '/teleop', label: '手动遥控', icon: Gamepad2 },
  { to: '/voice', label: '语音交互', icon: Mic },
  { to: '/patrol', label: '巡检任务', icon: ClipboardList },
  { to: '/vision', label: '视觉中心', icon: Video, phase2: true },
  { to: '/logs', label: '任务与日志', icon: FileText, phase2: true },
  { to: '/settings', label: '系统设置', icon: Settings, phase2: true },
]

function StatusChip({
  icon,
  children,
  tone = 'default',
  title,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  tone?: 'default' | 'ok' | 'muted'
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium',
        tone === 'ok' && 'border-emerald-200/70 bg-emerald-50 text-emerald-700',
        tone === 'muted' && 'border-line bg-slate-50 text-ink-muted',
        tone === 'default' && 'border-line bg-white text-ink-soft',
      )}
    >
      {icon}
      {children}
    </span>
  )
}

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const location = useLocation()

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="关闭菜单"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-white',
          'top-16 transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[240px]',
          'w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <nav className="scroll-thin flex-1 overflow-y-auto px-2.5 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = location.pathname.startsWith(item.to)
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                      collapsed && 'lg:justify-center lg:px-0',
                      active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-50 hover:text-ink',
                    )}
                  >
                    {active ? (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600"
                        aria-hidden
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        'h-[17px] w-[17px] shrink-0',
                        active ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink-soft',
                      )}
                      aria-hidden
                    />
                    <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                    {item.phase2 ? (
                      <span
                        className={cn(
                          'ml-auto rounded border border-dashed border-line-strong px-1 py-px text-[10px] text-ink-muted',
                          collapsed && 'lg:hidden',
                        )}
                      >
                        二期
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-2.5">
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              'hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-slate-50 hover:text-ink lg:flex',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[17px] w-[17px]" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="h-[17px] w-[17px]" aria-hidden />
                <span className={cn(collapsed && 'lg:hidden')}>收起侧边栏</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted lg:hidden"
          >
            <X className="h-[17px] w-[17px]" aria-hidden />
            关闭菜单
          </button>
        </div>
      </aside>
    </>
  )
}

function UserMenu() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white pl-1.5 pr-2.5 text-sm font-medium text-ink transition-colors hover:border-brand-200 hover:bg-brand-50/50"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
          {user.name.slice(0, 1)}
        </span>
        <span className="hidden max-w-[88px] truncate sm:inline">{user.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 w-56 overflow-hidden rounded-xl border border-line bg-white shadow-xl shadow-ink/8"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge>
              <span className="text-[11px] text-ink-muted">学号 {user.studentId}</span>
            </div>
          </div>

          <Link
            to="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-slate-50 hover:text-brand-700"
          >
            <UserRound className="h-4 w-4" aria-hidden />
            个人资料与密码
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
              navigate('/login', { replace: true })
            }}
            className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            退出登录
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** 顶栏：时间统一在这里显示，各页面不再重复出现 */
function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const status = useRobotStore((state) => state.status)
  const source = useRobotStore((state) => state.source)
  const socketStatus = useRobotStore((state) => state.socketStatus)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const isMock = source === 'mock'

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-full items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="打开菜单"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <Link to="/dashboard" className="hidden shrink-0 lg:block">
          <SparkLogo size={34} />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isMock ? (
            <Badge tone="warning" dot className="hidden xl:inline-flex">
              演示数据 · 未接真机
            </Badge>
          ) : (
            <Badge
              tone={socketStatus === 'open' ? 'success' : 'muted'}
              dot
              className="hidden xl:inline-flex"
            >
              {socketStatus === 'open' ? '实时已连接' : '实时重连中'}
            </Badge>
          )}

          <div className="hidden items-center gap-2.5 rounded-full border border-line bg-white px-3 py-1 md:flex">
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
              <CalendarDays className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
              {formatDate(now)}
            </span>
            <span className="h-4 w-px bg-line" aria-hidden />
            <span className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold tabular-nums text-ink">
              <Clock3 className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
              {formatClock(now)}
            </span>
          </div>

          <StatusChip
            icon={
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            }
            tone="ok"
            title={`${status.name} · ${status.model}`}
          >
            <span className="hidden sm:inline">机器人在线</span>
          </StatusChip>

          <StatusChip
            icon={<BatteryCharging className="h-4 w-4" aria-hidden />}
            tone="muted"
            title="电池数据待底盘运行态确认，暂无真实值"
          >
            电量 --
          </StatusChip>

          <StatusChip
            icon={<Wifi className="h-4 w-4" aria-hidden />}
            title={status.network.ip ? `IP ${status.network.ip}` : 'IP 未知'}
          >
            <span className="hidden sm:inline">网络正常</span>
          </StatusChip>

          <button
            type="button"
            aria-label="通知"
            className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors hover:border-brand-200 hover:bg-brand-50/50 sm:inline-flex"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas">
      <Header onOpenMobile={() => setMobileOpen(true)} />

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          'pt-16 transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[240px]',
        )}
      >
        <main className="mx-auto max-w-[1680px] px-3 py-3 sm:px-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
