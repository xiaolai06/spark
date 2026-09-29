import { useState } from 'react'
import {
  BatteryCharging,
  Flag,
  Gauge,
  MapPin,
  Navigation,
  Pencil,
  Play,
  Plus,
  Search,
  Square,
} from 'lucide-react'
import { MapPanel } from '@/components/dashboard/MapPanel'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MOCK_WAYPOINTS } from '@/mock/robotMock'
import { formatNumber, formatPose, formatWithUnit } from '@/lib/format'
import { useRobotStore } from '@/store/robot'

const TONE_BY_CODE: Record<string, string> = {
  start: 'border-red-200 bg-red-50 text-red-600',
  'lab-a': 'border-emerald-200 bg-emerald-50 text-emerald-600',
  'lab-b': 'border-brand-200 bg-brand-50 text-brand-600',
  equipment: 'border-violet-200 bg-violet-50 text-violet-600',
  door: 'border-orange-200 bg-orange-50 text-orange-600',
  charge: 'border-brand-200 bg-brand-50 text-brand-600',
}

/** 地图导航：地图 + 目标点/导航状态 + 预设点位 */
export function NavigationPage() {
  const status = useRobotStore((state) => state.status)
  const [keyword, setKeyword] = useState('')
  const [target, setTarget] = useState('lab-a')

  const waypoints = MOCK_WAYPOINTS.filter((item) => item.name.includes(keyword.trim()))
  const current = MOCK_WAYPOINTS.find((item) => item.code === target) ?? MOCK_WAYPOINTS[1]

  return (
    <PageShell>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="min-h-0 xl:col-span-8">
          <MapPanel />
        </div>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 xl:col-span-4">
          <Panel>
            <PanelHead
              icon={<MapPin className="h-4 w-4" aria-hidden />}
              title="目标点信息"
              extra={<Button size="sm" variant="secondary">更换目标点</Button>}
            />
            <dl className="divide-y divide-line">
              {[
                ['目标点', current.name],
                ['地图坐标', `(${current.x.toFixed(2)}, ${current.y.toFixed(2)}, 0.0) m`],
                ['相对距离', `${formatNumber(status.navigation.distanceRemaining)} m`],
                ['预计到达时间', '约 8 秒（0.25 m/s）'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-4 py-1.5">
                  <dt className="shrink-0 text-xs text-ink-muted">{label}</dt>
                  <dd className="truncate text-xs font-medium text-brand-700">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel>
            <PanelHead
              icon={<Gauge className="h-4 w-4" aria-hidden />}
              title="导航状态"
              extra={<Badge tone={status.navigation.status === 'moving' ? 'success' : 'muted'} dot>导航中</Badge>}
            />
            <dl className="divide-y divide-line">
              {[
                ['当前位置', formatPose(status.pose)],
                ['当前姿态', '航向角 87.3°'],
                ['当前速度', formatWithUnit(status.motion.linearVelocity, 'm/s')],
                ['电池电量', '--'],
                ['网络状态', <span key="net" className="inline-flex items-center gap-1 text-emerald-600">网络正常</span>],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between gap-3 px-4 py-1.5">
                  <dt className="shrink-0 text-xs text-ink-muted">{label as string}</dt>
                  <dd className="truncate font-mono text-[11px] font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" icon={<MapPin className="h-3.5 w-3.5" aria-hidden />}>设置目标点</Button>
            <Button size="sm" icon={<Play className="h-3.5 w-3.5" aria-hidden />}>开始导航</Button>
            <Button size="sm" variant="danger" icon={<Square className="h-3.5 w-3.5" aria-hidden />}>取消任务</Button>
            <Button size="sm" variant="success" icon={<BatteryCharging className="h-3.5 w-3.5" aria-hidden />}>回充电区</Button>
            <Button size="sm" variant="secondary" block icon={<Flag className="h-3.5 w-3.5" aria-hidden />}>保存点位</Button>
          </div>
        </div>
      </div>

      {/* 预设点位 */}
      <Panel className="h-[13.5rem] shrink-0">
        <PanelHead
          icon={<Navigation className="h-4 w-4" aria-hidden />}
          title="预设点位"
          extra={
            <div className="flex items-center gap-2">
              <span className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" aria-hidden />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索点位名称"
                  className="field-control h-8 w-44 pl-8 text-xs"
                />
              </span>
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" aria-hidden />}>新增点位</Button>
            </div>
          }
        />
        <div className="scroll-thin h-full overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
            {waypoints.map((point) => {
              const active = point.code === target
              return (
                <article
                  key={point.id}
                  className={`rounded-xl border p-2.5 transition-colors ${TONE_BY_CODE[point.code] ?? 'border-line bg-white text-ink-soft'} ${active ? 'ring-2 ring-brand-300' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{point.name}</p>
                    <button type="button" aria-label={`${point.name} 更多操作`} className="opacity-60 hover:opacity-100">
                      ⋮
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-[11px] opacity-80">
                    ({point.x.toFixed(2)}, {point.y.toFixed(2)}, 0.00) m
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <Button size="sm" block onClick={() => setTarget(point.code)}>
                      设为目标
                    </Button>
                    <Button size="sm" variant="secondary" block icon={<Pencil className="h-3 w-3" aria-hidden />}>
                      编辑
                    </Button>
                  </div>
                </article>
              )
            })}
            {waypoints.length === 0 ? (
              <p className="col-span-full py-6 text-center text-xs text-ink-muted">没有匹配的点位</p>
            ) : null}
          </div>
        </div>
      </Panel>
    </PageShell>
  )
}
