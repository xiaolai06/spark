import { useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Gamepad2,
  Keyboard,
  Radio,
  RefreshCw,
  Square,
  Wifi,
  Zap,
} from 'lucide-react'
import { CameraPanel } from '@/components/dashboard/CameraPanel'
import { MapPanel } from '@/components/dashboard/MapPanel'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatWithUnit } from '@/lib/format'
import { useRobotStore } from '@/store/robot'

const PRESET_SPEEDS = [
  { label: '低速', value: '0.1 m/s', active: false },
  { label: '中速', value: '0.3 m/s', active: true },
  { label: '高速', value: '0.6 m/s', active: false },
]

const D_PAD = [
  { key: 'up', icon: ArrowUp, label: '前进' },
  { key: 'left', icon: ArrowLeft, label: '左转' },
  { key: 'down', icon: ArrowDown, label: '后退' },
  { key: 'right', icon: ArrowRight, label: '右转' },
] as const

const KEYS = [
  { key: 'W', label: '前进' },
  { key: 'A', label: '左转' },
  { key: 'S', label: '后退' },
  { key: 'D', label: '右转' },
  { key: '空格', label: '急停' },
] as const

/** 手动遥控：严格区分设定速度与实际速度 */
export function TeleopPage() {
  const status = useRobotStore((state) => state.status)
  const [linear, setLinear] = useState(0.25)
  const [angular, setAngular] = useState(0)
  const [pressed, setPressed] = useState<string | null>(null)

  return (
    <PageShell>
      {/* 上排：摄像头 / 地图 / 状态 */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-3 xl:col-span-9">
          <div className="min-h-0">
            <CameraPanel />
          </div>
          <div className="min-h-0 lg:col-span-2">
            <MapPanel compact />
          </div>
        </div>

        <Panel scroll className="xl:col-span-3">
          <PanelHead
            icon={<Radio className="h-4 w-4" aria-hidden />}
            title="机器人状态"
            extra={<Badge tone="success" dot>在线运行</Badge>}
          />
          <dl className="divide-y divide-line">
            {[
              ['当前模式', <Badge key="m" tone="brand">手动遥控</Badge>],
              ['当前位置', <span key="p" className="font-mono text-[11px]">({formatWithNum(status.pose.x)}, {formatWithNum(status.pose.y)}) m</span>],
              ['实际线速度', formatWithUnit(status.motion.linearVelocity, 'm/s')],
              ['角速度', formatWithUnit(status.motion.angularVelocity, 'rad/s')],
              ['电池电量', '--'],
              ['电机状态', <span key="m2" className="text-emerald-600">正常</span>],
              ['网络状态', <span key="n" className="text-emerald-600">网络正常</span>],
              ['通信延迟', `${status.network.latencyMs ?? '--'} ms`],
              ['急停状态', status.emergencyStop ? '已触发' : <span className="text-emerald-600">未触发</span>],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between gap-3 px-4 py-[7px]">
                <dt className="shrink-0 text-xs text-ink-muted">{label as string}</dt>
                <dd className="truncate font-mono text-[11px] font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      {/* 下排：运动控制 / 键盘说明 / 手柄 */}
      <div className="grid min-h-0 shrink-0 grid-cols-1 gap-3 lg:grid-cols-12 lg:h-[17rem]">
        <Panel className="lg:col-span-6">
          <PanelHead
            icon={<Gamepad2 className="h-4 w-4" aria-hidden />}
            title="运动控制"
            extra={<Badge tone="muted">Deadman 5 s</Badge>}
          />
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 sm:grid-cols-2">
            {/* 方向盘 */}
            <div className="relative mx-auto aspect-square w-full max-w-[10.5rem]">
              <div className="absolute inset-0 rounded-full bg-brand-50/60" aria-hidden />
              {D_PAD.map((item) => {
                const Icon = item.icon
                const position = {
                  up: 'left-1/2 top-1 -translate-x-1/2',
                  down: 'bottom-1 left-1/2 -translate-x-1/2',
                  left: 'left-1 top-1/2 -translate-y-1/2',
                  right: 'right-1 top-1/2 -translate-y-1/2',
                }[item.key]
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={item.label}
                    onPointerDown={() => setPressed(item.key)}
                    onPointerUp={() => setPressed(null)}
                    onPointerLeave={() => setPressed(null)}
                    className={cn(
                      'absolute flex h-12 w-12 flex-col items-center justify-center rounded-full border bg-white text-ink shadow-sm transition-all',
                      position,
                      pressed === item.key ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-line hover:border-brand-200',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="mt-0.5 text-[10px]">{item.label}</span>
                  </button>
                )
              })}
              <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink-muted shadow-sm">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
              </span>
            </div>

            {/* 速度滑杆 */}
            <div className="flex min-w-0 flex-col justify-center gap-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-ink-muted">线速度 (m/s)</span>
                  <span className="font-mono font-semibold text-ink">{linear.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={linear}
                  onChange={(event) => setLinear(Number(event.target.value))}
                  className="w-full accent-brand-600"
                  aria-label="线速度"
                />
                <div className="mt-0.5 flex justify-between text-[10px] text-ink-muted">
                  <span>0.00</span>
                  <span>1.00</span>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-ink-muted">角速度 (rad/s)</span>
                  <span className="font-mono font-semibold text-ink">{angular.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={angular}
                  onChange={(event) => setAngular(Number(event.target.value))}
                  className="w-full accent-brand-600"
                  aria-label="角速度"
                />
                <div className="mt-0.5 flex justify-between text-[10px] text-ink-muted">
                  <span>-1.00</span>
                  <span>1.00</span>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-ink-muted">预设速度</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_SPEEDS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setLinear(preset.value.startsWith('0.1') ? 0.1 : preset.value.startsWith('0.3') ? 0.3 : 0.6)}
                      className={cn(
                        'rounded-lg border px-1 py-1.5 text-center transition-colors',
                        preset.active
                          ? 'border-brand-300 bg-brand-50 text-brand-700'
                          : 'border-line bg-white text-ink-muted hover:border-brand-200',
                      )}
                    >
                      <span className="block text-[11px] font-medium">{preset.label}</span>
                      <span className="block font-mono text-[10px] opacity-80">{preset.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-3 pb-3">
            <Button variant="danger" block className="h-11" icon={<Square className="h-4 w-4" aria-hidden />}>
              急 停
            </Button>
            <p className="mt-1.5 text-center text-[11px] text-ink-muted">
              演示模式：松手、切页或心跳超时会自动发送零速度；真实控制需安全门禁通过
            </p>
          </div>
        </Panel>

        <Panel scroll className="lg:col-span-3">
          <PanelHead icon={<Keyboard className="h-4 w-4" aria-hidden />} title="键盘控制说明" extra={<Badge tone="success" dot>支持中</Badge>} />
          <div className="p-4">
            <p className="mb-2 text-center text-[11px] text-ink-muted">前进</p>
            <div className="grid grid-cols-3 gap-2">
              {KEYS.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col items-center gap-1 rounded-lg border border-line bg-slate-50 py-2"
                >
                  <kbd className="rounded border border-line-strong bg-white px-2 py-1 font-mono text-xs font-semibold text-ink">
                    {item.key}
                  </kbd>
                  <span className="text-[10px] text-ink-muted">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-dashed border-line-strong bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-ink-muted">
              按键松开或窗口失焦将立即发送零速度命令，避免机器人持续失控运动。
            </div>
          </div>
        </Panel>

        <Panel scroll className="lg:col-span-3">
          <PanelHead icon={<Gamepad2 className="h-4 w-4" aria-hidden />} title="游戏手柄控制" extra={<Badge tone="success" dot>已连接</Badge>} />
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-gradient-to-b from-slate-100 to-slate-200">
              <Gamepad2 className="h-10 w-10 text-ink-muted" aria-hidden />
            </div>
            <p className="text-sm font-medium text-ink">Xbox 无线控制器</p>
            <ul className="w-full space-y-1 text-[11px]">
              {[
                ['蓝牙', '已连接', 'text-emerald-600'],
                ['电量', '85%', 'text-ink-soft'],
                ['死区', '已启用', 'text-ink-soft'],
              ].map(([label, value, cls]) => (
                <li key={label} className="flex items-center justify-between">
                  <span className="text-ink-muted">{label}</span>
                  <span className={cls}>{value}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="secondary" block icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}>
              控制映射说明
            </Button>
            <p className="flex items-center gap-1 text-[11px] text-ink-muted">
              <Wifi className="h-3 w-3" aria-hidden />
              延迟稳定在 30 ms 内
            </p>
            <p className="flex items-center gap-1 text-[11px] text-amber-600">
              <Zap className="h-3 w-3" aria-hidden />
              手柄与键盘同时操作时以最后按下者为准
            </p>
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}

function formatWithNum(value: number | null): string {
  return value === null ? '--' : value.toFixed(2)
}
