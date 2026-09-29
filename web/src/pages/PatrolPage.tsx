import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Eye,
  Play,
  Plus,
  Route,
  ScanEye,
  Siren,
  Square,
  Users,
} from 'lucide-react'
import { MapPanel } from '@/components/dashboard/MapPanel'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useRobotStore } from '@/store/robot'

const STAT_CARDS = [
  { label: '任务总数', value: '12', delta: '较上周 +3', tone: 'text-brand-600', bg: 'bg-brand-50', icon: ClipboardList },
  { label: '今日执行', value: '3', delta: '较昨日 +1', tone: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  { label: '执行中', value: '1', delta: '较昨日 0', tone: 'text-brand-600', bg: 'bg-brand-50', icon: Play },
  { label: '异常', value: '2', delta: '较昨日 +1', tone: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
]

const TABS = ['全部任务 (12)', '执行中 (1)', '计划任务 (3)', '已完成 (8)'] as const

const CHECK_ITEMS = [
  { label: '人员检测', desc: '识别人员并检测异常滞留', icon: Users, on: true },
  { label: '通道障碍', desc: '检测通道障碍物、堆物情况', icon: Route, on: true },
  { label: '物品在位', desc: '检查实验设备与物品是否在位', icon: Boxes, on: true },
  { label: '异常告警', desc: '烟雾、异响、设备异常等', icon: Siren, on: true },
]

const RECENT_TASKS = [
  { name: '实验室日常巡检', status: '执行中', tone: 'success' as const, time: '2026-09-29 14:24', duration: '00:04:32', events: '0' },
  { name: '晚间安全巡检', status: '已完成', tone: 'brand' as const, time: '2026-09-29 10:00', duration: '00:12:35', events: '1' },
  { name: '实验设备专项检查', status: '异常', tone: 'danger' as const, time: '2026-09-28 16:20', duration: '00:08:21', events: '1' },
  { name: '周间行巡检', status: '已完成', tone: 'brand' as const, time: '2026-09-28 10:00', duration: '00:11:08', events: '0' },
]

const ALERTS = [
  { title: '通道存在障碍物', level: '高', place: '实验台B区域', time: '14:27:53', handled: '未处理', tone: 'danger' as const },
  { title: '物品未在位', level: '中', place: '器材区', time: '14:12:18', handled: '未处理', tone: 'warning' as const },
  { title: '检测到人员滞留', level: '中', place: '门口区域', time: '13:35:02', handled: '已处理', tone: 'warning' as const },
  { title: '设备异常（温度过高）', level: '高', place: '实验台A', time: '10:14:25', handled: '已处理', tone: 'danger' as const },
]

/** 巡检任务：统计、当前任务、路线、检查项与异常 */
export function PatrolPage() {
  const status = useRobotStore((state) => state.status)

  return (
    <PageShell>
      {/* 统计卡 */}
      <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Panel key={card.label} className="px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', card.bg, card.tone)}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-ink-muted">{card.label}</p>
                  <p className="font-mono text-lg font-bold leading-tight text-ink">{card.value}</p>
                </div>
                <span className="ml-auto shrink-0 text-[10px] text-ink-muted">{card.delta}</span>
              </div>
            </Panel>
          )
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-3 xl:col-span-7">
          {/* 任务筛选 */}
          <Panel>
            <div className="scroll-thin flex items-center gap-1.5 overflow-x-auto px-2.5 py-2">
              {TABS.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    index === 0 ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-slate-50 hover:text-ink',
                  )}
                >
                  {tab}
                </button>
              ))}
              <Button size="sm" className="ml-auto shrink-0" icon={<Plus className="h-3.5 w-3.5" aria-hidden />}>
                新建巡检任务
              </Button>
            </div>
          </Panel>

          {/* 当前执行任务 */}
          <Panel scroll>
            <PanelHead
              icon={<ClipboardList className="h-4 w-4" aria-hidden />}
              title="实验室日常巡检"
              extra={<Badge tone="success" dot>执行中</Badge>}
            />
            <div className="space-y-2 p-3">
              {[
                ['任务描述', '按设定路线对实验室重点区域进行日常巡检，检测人员、物品、障碍物及异常情况。'],
                ['巡检路线', '实验台 A → 实验台 B → 器材区 → 门口 → 充电区'],
                ['当前节点', '实验台 B（2 / 5）'],
                ['已用时', '00:04:32'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start gap-3 text-xs">
                  <span className="w-16 shrink-0 text-ink-muted">{label}</span>
                  <span className="min-w-0 flex-1 text-ink-soft">{value}</span>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {['人员检测', '物品在位', '通道障碍', '异常告警'].map((item) => (
                  <Badge key={item} tone="muted">{item}</Badge>
                ))}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted">任务进度</span>
                  <span className="font-mono font-semibold text-ink">40%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[40%] rounded-full bg-brand-600" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button size="sm" variant="secondary" icon={<Eye className="h-3.5 w-3.5" aria-hidden />}>查看任务</Button>
                <Button size="sm" variant="secondary">暂停</Button>
                <Button size="sm" variant="danger" icon={<Square className="h-3.5 w-3.5" aria-hidden />}>终止</Button>
              </div>
            </div>
          </Panel>

          {/* 检查项 + 最近任务 */}
          <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel scroll>
              <PanelHead icon={<ScanEye className="h-4 w-4" aria-hidden />} title="巡检项目（配置项）" extra={<button type="button" className="text-[11px] text-brand-700 hover:underline">编辑配置</button>} />
              <ul className="divide-y divide-line">
                {CHECK_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.label} className="flex items-center gap-2.5 px-3.5 py-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-ink">{item.label}</p>
                        <p className="truncate text-[11px] text-ink-muted">{item.desc}</p>
                      </div>
                      <span className={cn('relative h-4 w-7 shrink-0 rounded-full', item.on ? 'bg-brand-600' : 'bg-slate-300')}>
                        <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', item.on ? 'left-3.5' : 'left-0.5')} />
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Panel>

            <Panel scroll>
              <PanelHead icon={<ClipboardList className="h-4 w-4" aria-hidden />} title="最近巡检任务" extra={<button type="button" className="text-[11px] text-brand-700 hover:underline">查看更多</button>} />
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-white text-ink-muted">
                  <tr className="border-b border-line">
                    <th className="px-3 py-1.5 font-medium">任务名称</th>
                    <th className="px-2 py-1.5 font-medium">状态</th>
                    <th className="px-2 py-1.5 font-medium">巡检时长</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {RECENT_TASKS.map((task) => (
                    <tr key={task.name} className="transition-colors hover:bg-slate-50">
                      <td className="truncate px-3 py-1.5 text-ink-soft">{task.name}</td>
                      <td className="px-2 py-1.5">
                        <Badge tone={task.tone}>{task.status}</Badge>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-ink-muted">{task.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        </div>

        {/* 路线 + 异常告警 */}
        <div className="grid min-h-0 grid-rows-[minmax(0,1.25fr)_minmax(0,1fr)] gap-3 xl:col-span-5">
          <div className="min-h-0">
            <MapPanel compact />
          </div>

          <Panel scroll>
            <PanelHead
              icon={<Siren className="h-4 w-4" aria-hidden />}
              title="异常事件告警"
              extra={<button type="button" className="text-[11px] text-brand-700 hover:underline">查看更多</button>}
            />
            <ul className="divide-y divide-line">
              {ALERTS.map((alert) => (
                <li key={alert.title} className="flex items-center gap-2.5 px-3.5 py-2">
                  <span
                    className={cn(
                      'h-8 w-8 shrink-0 rounded-lg',
                      alert.tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600',
                    )}
                  >
                    <AlertTriangle className="mx-auto mt-2 h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{alert.title}</p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {alert.place} · {alert.time}
                    </p>
                  </div>
                  <Badge tone={alert.tone}>{alert.level}</Badge>
                  <Badge tone={alert.handled === '已处理' ? 'success' : 'muted'}>{alert.handled}</Badge>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-3.5 py-1.5 text-[11px] text-ink-muted">
              当前任务：{status.task.name ?? '--'} · 进度 {status.task.progress ?? '--'}%
            </p>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
