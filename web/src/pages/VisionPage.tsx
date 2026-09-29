import {
  BarChart3,
  Box,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Radio,
  ScanFace,
  Shapes,
  Target,
  Users,
} from 'lucide-react'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const MODES = [
  { label: '人脸检测', icon: ScanFace, active: true },
  { label: '颜色识别', icon: Shapes, active: false },
  { label: '行人检测', icon: Users, active: false },
  { label: '目标跟随', icon: Target, active: false },
]

const CAMERAS = [
  { id: 1, name: 'Camera 1', place: '实验台A · 前视摄像头', boxes: [{ label: '行人', score: '0.92', tone: 'bg-emerald-500' }, { label: '机械臂', score: '0.88', tone: 'bg-brand-500' }] },
  { id: 2, name: 'Camera 2', place: '实验台B · 右侧摄像头', boxes: [{ label: '行人', score: '0.87', tone: 'bg-emerald-500' }] },
  { id: 3, name: 'Camera 3', place: '入口区域 · 全景摄像头', boxes: [{ label: '红色工具箱', score: '0.93', tone: 'bg-red-500' }] },
  { id: 4, name: 'Camera 4', place: '机械臂区域 · 俯视摄像头', boxes: [{ label: '机械臂', score: '0.91', tone: 'bg-brand-500' }] },
]

const DETECTIONS = [
  { type: '红色工具箱', score: 0.95, state: '异常', tone: 'danger' as const },
  { type: '行人', score: 0.92, state: '正常', tone: 'success' as const },
  { type: '机械臂', score: 0.91, state: '正常', tone: 'success' as const },
  { type: '工具箱', score: 0.9, state: '正常', tone: 'success' as const },
  { type: '障碍物', score: 0.83, state: '正常', tone: 'success' as const },
]

const STATS = [
  { label: '行人', value: 36, delta: '↑ 12%', tone: 'text-emerald-600', icon: Users },
  { label: '机械臂', value: 28, delta: '↓ 8%', tone: 'text-brand-600', icon: Target },
  { label: '工具箱', value: 12, delta: '↑ 33%', tone: 'text-red-600', icon: Box },
  { label: '障碍物', value: 9, delta: '↑ 50%', tone: 'text-orange-600', icon: Shapes },
]

const TREND = [18, 14, 20, 22, 16, 26, 24, 30, 28, 34, 32, 40, 36, 32]
const SERIES = [
  { name: '行人', color: '#22c55e' },
  { name: '机械臂', color: '#3b82f6' },
  { name: '工具箱', color: '#ef4444' },
  { name: '障碍物', color: '#f97316' },
]

/** 视觉中心（第二期）：多路检测画面、结果表、统计与快照 */
export function VisionPage() {
  return (
    <PageShell>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        {/* 左：模式 + 四路画面 */}
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_minmax(0,9rem)] gap-3 xl:col-span-8">
          <Panel>
            <div className="flex items-center gap-1.5 overflow-x-auto px-2.5 py-2">
              {MODES.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.label}
                    type="button"
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      mode.active ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-slate-50 hover:text-ink',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {mode.label}
                  </button>
                )
              })}
              <Badge tone="warning" className="ml-auto shrink-0">演示数据 · 未接真机</Badge>
            </div>
          </Panel>

          <div className="grid min-h-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {CAMERAS.map((camera) => (
              <Panel key={camera.id}>
                <PanelHead
                  icon={<Camera className="h-4 w-4" aria-hidden />}
                  title={camera.name}
                  extra={
                    <div className="flex items-center gap-1.5">
                      <Badge tone="success" dot>实时</Badge>
                      <Maximize2 className="h-3 w-3 text-ink-muted" aria-hidden />
                    </div>
                  }
                />
                <div className="relative min-h-0 flex-1 bg-slate-900 p-2">
                  <div className="flex h-full items-center justify-center">
                    <span className="rounded-md bg-black/40 px-2 py-1 text-[10px] text-white/70">{camera.place}</span>
                  </div>
                  {camera.boxes.map((box, index) => (
                    <span
                      key={box.label}
                      className={cn(
                        'absolute inline-flex items-center gap-1 rounded border border-white/70 px-1.5 py-0.5 text-[10px] font-medium text-white',
                        box.tone,
                      )}
                      style={{ left: `${12 + index * 34}%`, top: `${26 + index * 22}%` }}
                    >
                      {box.label} {box.score}
                    </span>
                  ))}
                  <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] text-white/85">
                    1920 × 1080 · 30 FPS
                  </span>
                </div>
              </Panel>
            ))}
          </div>

          <Panel scroll>
            <PanelHead icon={<ImageIcon className="h-4 w-4" aria-hidden />} title="关键识别快照" extra={<button type="button" className="text-[11px] text-brand-700 hover:underline">查看更多</button>} />
            <div className="flex gap-2.5 p-3">
              {['检测到行人', '红色工具箱', '机械臂', '障碍物', '检测到行人', '工具箱'].map((label, index) => (
                <figure key={index} className="w-28 shrink-0">
                  <div className="flex h-16 items-center justify-center rounded-lg bg-slate-100">
                    <Camera className="h-5 w-5 text-ink-muted" aria-hidden />
                  </div>
                  <figcaption className="mt-1 space-y-0.5">
                    <p className="truncate text-[11px] font-medium text-ink">{label}</p>
                    <p className="truncate font-mono text-[10px] text-ink-muted">置信度 0.{90 - index}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Panel>
        </div>

        {/* 右：识别结果 + 统计 + 关联检测 */}
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 xl:col-span-4">
          <Panel scroll>
            <PanelHead
              icon={<ScanFace className="h-4 w-4" aria-hidden />}
              title="识别结果"
              extra={<Badge tone="muted">全部类型</Badge>}
            />
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-white text-ink-muted">
                <tr className="border-b border-line">
                  <th className="px-3 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">目标类型</th>
                  <th className="px-2 py-1.5 font-medium">置信度</th>
                  <th className="px-2 py-1.5 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {DETECTIONS.map((item, index) => (
                  <tr key={item.type} className="transition-colors hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-mono text-ink-muted">{index + 1}</td>
                    <td className="truncate px-2 py-1.5 text-ink-soft">{item.type}</td>
                    <td className="px-2 py-1.5 font-mono text-ink">{item.score.toFixed(2)}</td>
                    <td className="px-2 py-1.5">
                      <Badge tone={item.tone}>{item.state}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel scroll>
            <PanelHead icon={<BarChart3 className="h-4 w-4" aria-hidden />} title="今日检测统计" extra={<Badge tone="success" dot>实时</Badge>} />
            <div className="grid grid-cols-4 gap-2 p-3">
              {STATS.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <Icon className={cn('mx-auto h-4 w-4', stat.tone)} aria-hidden />
                    <p className="mt-0.5 font-mono text-base font-bold text-ink">{stat.value}</p>
                    <p className="truncate text-[10px] text-ink-muted">{stat.label}</p>
                    <p className={cn('text-[10px]', stat.tone)}>{stat.delta}</p>
                  </div>
                )
              })}
            </div>

            <div className="px-3 pb-3">
              <p className="mb-1.5 text-[11px] font-medium text-ink-soft">识别数量趋势</p>
              <div className="flex h-24 items-end gap-1">
                {TREND.map((value, index) => (
                  <div key={index} className="group flex flex-1 flex-col justify-end gap-0.5">
                    <span className="w-full rounded-sm bg-emerald-500/80" style={{ height: `${value * 1.6}px` }} title={`行人 ${value}`} />
                    <span className="w-full rounded-sm bg-brand-500/70" style={{ height: `${value * 1.1}px` }} />
                    <span className="w-full rounded-sm bg-red-500/60" style={{ height: `${value * 0.6}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                {SERIES.map((series) => (
                  <span key={series.name} className="inline-flex items-center gap-1 text-[10px] text-ink-muted">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: series.color }} aria-hidden />
                    {series.name}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead icon={<Target className="h-4 w-4" aria-hidden />} title="当前任务关联检测" extra={<Badge tone="danger" dot>存在异常</Badge>} />
            <div className="space-y-2 p-3">
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-2.5">
                <Radio className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-red-700">红色工具箱（置信度 0.95）</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-red-700/80">
                    属于当前巡检任务「实验台A设备检查」的关键目标，检测到位置异常（未在规定区域内），请及时处理。
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" block>查看任务详情</Button>
                <Button size="sm" variant="danger" block>定位目标位置</Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
