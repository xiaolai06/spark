import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  className?: string
}

/**
 * 页面统一容器。
 *
 * 约定：
 * 1. 页面不放一级标题，标题由卡片/顶栏承担；
 * 2. 内容区高度锁定为一屏，内部区域自行滚动，避免整页出现双滚动条；
 * 3. 所有页面使用同一内边距与栅格间距，保证尺寸统一。
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('flex h-[calc(100vh-4rem)] flex-col gap-3 overflow-hidden', className)}>
      {children}
    </div>
  )
}

interface PanelProps {
  children: ReactNode
  className?: string
  /** 内部滚动 */
  scroll?: boolean
}

/** 统一的面板块：固定最小高度、超出滚动 */
export function Panel({ children, className, scroll }: PanelProps) {
  return (
    <section
      className={cn(
        'card flex min-h-0 flex-col overflow-hidden',
        scroll && 'scroll-thin overflow-y-auto',
        className,
      )}
    >
      {children}
    </section>
  )
}

/** 统一的面板标题栏高度，避免各卡片标题大小/高度不一致 */
export function PanelHead({
  title,
  icon,
  extra,
  className,
}: {
  title: ReactNode
  icon?: ReactNode
  extra?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex h-11 shrink-0 items-center justify-between gap-2 border-b border-line px-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <span className="shrink-0 text-brand-600">{icon}</span> : null}
        <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
      </div>
      {extra ? <div className="flex shrink-0 items-center gap-1.5">{extra}</div> : null}
    </header>
  )
}
