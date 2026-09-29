import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: ReactNode
}

export function Card({ className, children }: CardProps) {
  return <section className={cn('card', className)}>{children}</section>
}

interface CardHeaderProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** 标题栏右侧的操作区 */
  actions?: ReactNode
  /** 窄栏位下允许标题换行，避免被截断 */
  wrapTitle?: boolean
  className?: string
}

export function CardHeader({ icon, title, description, actions, wrapTitle, className }: CardHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-3 border-b border-line px-5 py-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className={cn('text-[15px] font-semibold text-ink', wrapTitle ? '' : 'truncate')}>
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 truncate text-xs text-ink-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function CardBody({ className, children }: CardProps) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'muted'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  muted: 'bg-slate-50 text-ink-muted',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  )
}
