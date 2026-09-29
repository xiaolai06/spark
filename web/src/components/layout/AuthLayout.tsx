import type { ReactNode } from 'react'
import { SparkLogo } from '@/components/SparkLogo'

interface AuthLayoutProps {
  children: ReactNode
  /** 移动端隐藏的右侧介绍栏标题 */
  title: string
  subtitle: string
  /** 表单卡片下方的补充说明 */
  footer?: ReactNode
}

const HIGHLIGHTS = [
  { title: '地图导航与安全遥控', desc: 'SLAM 建图、点击导航、虚拟摇杆与独立急停' },
  { title: '本机语音联动', desc: '复用机器人本机识别，结果同步到屏幕与 Web' },
  { title: '巡检与视觉感知', desc: '任务状态机、多路检测与关键快照留痕' },
]

/** 登录 / 注册 / 找回密码 共用的左右分栏布局 */
export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="auth-canvas">
      <div className="auth-canvas__flow" aria-hidden />
      <div className="auth-canvas__orb auth-canvas__orb--brand" aria-hidden />
      <div className="auth-canvas__orb auth-canvas__orb--cyan" aria-hidden />
      <div className="auth-canvas__grid" aria-hidden />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 px-5 py-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-14 lg:py-0">
        {/* 左侧品牌介绍栏 */}
        <section className="hidden lg:block">
          <SparkLogo size={56} subtitle="NXROBO Spark 系列 · Ubuntu 20.04 + ROS1 Noetic" />

          <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight text-ink">
            让机器人实验
            <br />
            看得见、控得住
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            集机器人管理、SLAM 建图导航、语音交互、视觉感知、手动遥控和巡检任务于一体的智能机器人实验平台。
          </p>

          <ul className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-ink">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] text-ink-muted">{item.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 右侧表单卡片 */}
        <section className="w-full">
          <div className="mb-6 flex justify-center lg:hidden">
            <SparkLogo size={48} withText={false} />
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/85 p-7 shadow-xl shadow-brand-900/5 backdrop-blur-xl sm:p-9">
            <header className="mb-7 text-center">
              <h2 className="text-[26px] font-bold tracking-tight text-ink">{title}</h2>
              <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
            </header>

            {children}
          </div>

          <p className="mt-5 text-center text-xs text-ink-muted">© 2026 Spark 轮足机器人实验平台</p>
          {footer}
        </section>
      </div>
    </div>
  )
}
