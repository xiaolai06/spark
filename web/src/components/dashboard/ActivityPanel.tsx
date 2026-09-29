import { Eye, Navigation, ScanEye, Siren, Volume2, ArrowRight, Mic } from 'lucide-react'
import { Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { ActivityEvent } from '@/mock/robotMock'
import type { VoiceRecord } from '@/api/types'

const LEVEL_STYLE = {
  info: { dot: 'bg-brand-500', icon: Navigation },
  success: { dot: 'bg-emerald-500', icon: ScanEye },
  warning: { dot: 'bg-amber-500', icon: Eye },
  danger: { dot: 'bg-red-500', icon: Siren },
} as const

const SOURCE_LABEL: Record<ActivityEvent['source'], string> = {
  navigation: '导航',
  vision: '视觉',
  voice: '语音',
  system: '系统',
  patrol: '巡检',
}

/** 今日任务动态 / 最近事件 */
export function ActivityPanel({ events }: { events: ActivityEvent[] }) {
  return (
    <Panel scroll>
      <PanelHead
        icon={<ScanEye className="h-4 w-4" aria-hidden />}
        title="今日任务动态 / 最近事件"
        className="sticky top-0 z-10 bg-white"
        extra={
          <button type="button" className="text-xs font-medium text-brand-700 hover:underline">
            查看更多
          </button>
        }
      />
      <ol className="space-y-0.5 p-2">
        {events.map((event) => {
          const style = LEVEL_STYLE[event.level]
          const Icon = style.icon
          return (
            <li key={event.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} aria-hidden />
              <span className="shrink-0 font-mono text-[11px] text-ink-muted">{event.time}</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-50 text-brand-600">
                <Icon className="h-3 w-3" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">{event.text}</span>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-px text-[10px] text-ink-muted">
                {SOURCE_LABEL[event.source]}
              </span>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}

const VOICE_STATUS: Record<VoiceRecord['status'], { label: string; className: string }> = {
  parsed: { label: '已理解', className: 'text-emerald-600' },
  executing: { label: '执行中', className: 'text-amber-600' },
  done: { label: '已完成', className: 'text-emerald-600' },
  rejected: { label: '已拒绝', className: 'text-red-600' },
}

/** 语音交互卡：本机识别入口 + 最近识别记录 */
export function VoicePanel({ records }: { records: VoiceRecord[] }) {
  return (
    <Panel>
      <PanelHead
        icon={<Mic className="h-4 w-4" aria-hidden />}
        title="语音交互"
        extra={<Badge tone="success" dot>识别成功</Badge>}
      />

      <div className="flex shrink-0 items-center gap-3 px-4 py-3">
        <button
          type="button"
          aria-label="开始语音输入"
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/25 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/25" aria-hidden />
          <Mic className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink">点击开始语音输入</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
            复用本机 spark_voice，结果在机器人屏幕与本页同步
          </p>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-2.5">
        <p className="flex items-center gap-2 rounded-lg border border-line bg-slate-50 px-2.5 py-2">
          <Volume2 className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">“去实验台 A”</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden />
        </p>
      </div>

      <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto border-t border-line">
        {records.map((record) => (
          <li key={record.id} className="flex items-center gap-2 px-4 py-1.5">
            <span className="font-mono text-[11px] text-ink-muted">{record.time}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">“{record.text}”</span>
            <Badge tone={record.source === 'robot' ? 'brand' : 'muted'} className="!px-1.5 !py-px !text-[10px]">
              {record.source === 'robot' ? '本机' : '网页'}
            </Badge>
            <span className={cn('shrink-0 text-[11px]', VOICE_STATUS[record.status].className)}>
              {VOICE_STATUS[record.status].label}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
