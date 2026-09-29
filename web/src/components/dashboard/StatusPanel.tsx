import {
  AlertTriangle,
  BatteryCharging,
  Gauge,
  MapPin,
  Navigation,
  Radio,
  Route,
  Wifi,
  Zap,
} from 'lucide-react'
import { Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { formatNumber, formatPose, formatWithUnit } from '@/lib/format'
import type { RobotStatus } from '@/api/types'

/** 机器人状态卡：只放运行态，不放 CPU/内存等设备诊断 */
export function StatusPanel({ status }: { status: RobotStatus }) {
  const batteryUnknown = status.power.percentage === null

  const rows = [
    { icon: <Navigation className="h-3.5 w-3.5" aria-hidden />, label: '当前模式', value: <Badge tone="brand">{status.mode}</Badge> },
    { icon: <MapPin className="h-3.5 w-3.5" aria-hidden />, label: '当前位置', value: <span className="font-mono text-xs">{formatPose(status.pose)}</span> },
    { icon: <Route className="h-3.5 w-3.5" aria-hidden />, label: '当前任务', value: status.task.name ?? '--' },
    { icon: <Gauge className="h-3.5 w-3.5" aria-hidden />, label: '当前速度', value: formatWithUnit(status.motion.linearVelocity, 'm/s') },
    {
      icon: <BatteryCharging className="h-3.5 w-3.5" aria-hidden />,
      label: '电池电量',
      value: (
        <span className="inline-flex items-center gap-2">
          <span className={batteryUnknown ? 'text-ink-muted' : ''}>
            {batteryUnknown ? '--' : `${Math.round(status.power.percentage as number)}%`}
          </span>
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full bg-emerald-500"
              style={{
                width: `${batteryUnknown ? 0 : Math.min(100, Math.max(0, status.power.percentage as number))}%`,
              }}
            />
          </span>
        </span>
      ),
      hint: batteryUnknown ? '电池数据待底盘运行态确认' : undefined,
    },
    {
      icon: <Wifi className="h-3.5 w-3.5" aria-hidden />,
      label: '网络状态',
      value: <span className="inline-flex items-center gap-1.5 text-emerald-600">网络正常</span>,
    },
    {
      icon: <Zap className="h-3.5 w-3.5" aria-hidden />,
      label: '急停状态',
      value: status.emergencyStop ? <span className="text-state-bad">已触发</span> : <span className="text-emerald-600">正常（未触发）</span>,
    },
  ]

  return (
    <Panel>
      <PanelHead
        icon={<Radio className="h-4 w-4" aria-hidden />}
        title="机器人状态"
        extra={<Badge tone="success" dot>{status.online ? '在线运行' : '离线'}</Badge>}
      />
      <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 px-4 py-[7px]">
            <span className="inline-flex shrink-0 items-center gap-2 text-xs text-ink-muted">
              {row.icon}
              {row.label}
            </span>
            <span className="flex min-w-0 items-center justify-end gap-1 text-right text-xs font-medium text-ink" title={row.hint}>
              {row.value}
              {row.hint ? <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" aria-label={row.hint} /> : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="shrink-0 border-t border-line px-4 py-1.5 text-[11px] text-ink-muted">
        定位 AMCL / TF · 导航 {status.navigation.status} · 剩余 {formatNumber(status.navigation.distanceRemaining)} m
      </p>
    </Panel>
  )
}
