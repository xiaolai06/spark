import { useEffect, useState } from 'react'
import { Beaker, Box, Flag, Home, Octagon, PlayCircle, Send } from 'lucide-react'
import { Panel, PanelHead } from '@/components/layout/PageShell'
import { cn } from '@/lib/utils'
import { useRobotStore } from '@/store/robot'

const ACTIONS = [
  { id: 'equip', label: '去器材区', icon: Box, active: 'border-violet-300 bg-violet-50 text-violet-700', idle: 'border-violet-100 bg-violet-50/50 text-violet-600 hover:border-violet-300' },
  { id: 'lab-a', label: '去实验台A', icon: Beaker, active: 'border-emerald-300 bg-emerald-50 text-emerald-700', idle: 'border-emerald-100 bg-emerald-50/50 text-emerald-600 hover:border-emerald-300' },
  { id: 'start', label: '回起点', icon: Home, active: 'border-red-300 bg-red-50 text-red-700', idle: 'border-red-100 bg-red-50/50 text-red-600 hover:border-red-300' },
  { id: 'patrol', label: '开始巡检', icon: PlayCircle, active: 'border-brand-300 bg-brand-50 text-brand-700', idle: 'border-brand-100 bg-brand-50/50 text-brand-600 hover:border-brand-300' },
] as const

/**
 * 快捷控制。
 * 演示模式下只给本地反馈，不下发真实导航命令；
 * 接后端后由 NavigationService 校验目标与急停状态再执行。
 */
export function QuickControlPanel() {
  const setPendingAction = useRobotStore((state) => state.setPendingAction)
  const pendingAction = useRobotStore((state) => state.pendingAction)
  const source = useRobotStore((state) => state.source)
  const [ack, setAck] = useState<string | null>(null)
  const isMock = source === 'mock'

  useEffect(() => {
    if (!pendingAction) return
    setAck(pendingAction)
    const timer = window.setTimeout(() => {
      setAck(null)
      setPendingAction(null)
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [pendingAction, setPendingAction])

  return (
    <Panel>
      <PanelHead
        icon={<Send className="h-4 w-4" aria-hidden />}
        title="快捷控制"
        extra={
          <span className="text-[11px] text-ink-muted">{isMock ? '演示模式' : '已接后端'}</span>
        }
      />

      <div className="grid shrink-0 grid-cols-2 gap-2 p-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          const active = pendingAction === action.id
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => setPendingAction(action.label)}
              className={cn(
                'inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 active:scale-[0.98]',
                active ? action.active : action.idle,
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {action.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setPendingAction('急停')}
          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-500 bg-red-500 text-sm font-bold text-white transition-all duration-200 hover:bg-red-600 active:scale-[0.98]"
        >
          <Octagon className="h-4 w-4" aria-hidden />
          急 停
        </button>
      </div>

      {ack ? (
        <p
          role="status"
          className="mx-3 mb-3 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800"
        >
          <Flag className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          演示模式：已记录「{ack}」。真实命令需在安全门禁通过后，由 NavigationService 校验后下发。
        </p>
      ) : null}
    </Panel>
  )
}
