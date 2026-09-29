import { useState } from 'react'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SparkLogoProps {
  /** 显示尺寸（像素），默认 40 */
  size?: number
  /** 是否显示平台名称文字 */
  withText?: boolean
  className?: string
  /** 文字主标题，默认「Spark 轮足机器人实验平台」 */
  title?: string
  subtitle?: string
}

/** 平台 Logo：使用 public/logo.png，图片缺失时回退为机器人图标 */
export function SparkLogo({
  size = 40,
  withText = true,
  className,
  title = 'Spark 轮足机器人实验平台',
  subtitle,
}: SparkLogoProps) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {failed ? (
        <span
          className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"
          style={{ width: size, height: size }}
          aria-hidden
        >
          <Bot style={{ width: size * 0.6, height: size * 0.6 }} />
        </span>
      ) : (
        <img
          src="/logo.png"
          alt="Spark 机器人 Logo"
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className="shrink-0 rounded-xl object-contain"
          style={{ width: size, height: size }}
        />
      )}
      {withText ? (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
