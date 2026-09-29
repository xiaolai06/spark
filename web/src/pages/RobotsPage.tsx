import {
  Activity,
  Bot,
  Camera,
  ChevronRight,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
  Mic,
  Radio,
  RefreshCw,
  Save,
  Settings2,
  Thermometer,
  Timer,
  Usb,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { SparkLogo } from '@/components/SparkLogo'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatInt, formatNumber, formatPercentage, formatUptime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useRobotStore } from '@/store/robot'

const TABS = ['设备概况', '传感器状态', '功能检测', 'ROS配置', '日志记录'] as const

const SENSOR_ROWS = [
  { icon: <Activity className="h-3.5 w-3.5" aria-hidden />, name: '移动底盘', state: 'online' as const, extra: '正常' },
  { icon: <Radio className="h-3.5 w-3.5" aria-hidden />, name: 'YDLIDAR 雷达', state: 'online' as const, extra: '8.2 Hz' },
  { icon: <Camera className="h-3.5 w-3.5" aria-hidden />, name: 'RealSense RGB', state: 'online' as const, extra: '30 FPS' },
  { icon: <Camera className="h-3.5 w-3.5" aria-hidden />, name: 'RealSense Depth', state: 'online' as const, extra: '30 FPS' },
  { icon: <Gauge className="h-3.5 w-3.5" aria-hidden />, name: 'IMU 惯性测量', state: 'online' as const, extra: '正常' },
  { icon: <Wrench className="h-3.5 w-3.5" aria-hidden />, name: '机械臂', state: 'unknown' as const, extra: '未检测到' },
  { icon: <Mic className="h-3.5 w-3.5" aria-hidden />, name: '麦克风', state: 'online' as const, extra: '正常' },
]

const STATE_TONE = {
  online: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: '正常' },
  offline: { dot: 'bg-red-500', text: 'text-red-600', label: '离线' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-600', label: '告警' },
  error: { dot: 'bg-red-500', text: 'text-red-600', label: '异常' },
  unknown: { dot: 'bg-slate-400', text: 'text-ink-muted', label: '未确认' },
} as const

/** 机器人管理：设备与系统诊断信息集中在本页 */
export function RobotsPage() {
  const status = useRobotStore((state) => state.status)

  const basicInfo = [
    ['机器人名称', status.name],
    ['机器人角色', '实验室主机器人'],
    ['机器人型号', status.model],
    ['主控平台', 'Intel NUC8i5BEK'],
    ['IP 地址', status.network.ip ?? '--'],
    ['MAC 地址', '00:1A:2B:3C:4D:5E'],
    ['ROS 版本', 'ROS1 Noetic'],
    ['系统版本', 'Ubuntu 20.04.5 LTS'],
    ['运行时长', formatUptime(status.system.uptimeSeconds)],
  ]

  const systemRows = [
    { icon: <Cpu className="h-3.5 w-3.5" aria-hidden />, label: 'CPU 使用率', value: formatPercentage(status.system.cpuUsage) },
    { icon: <Thermometer className="h-3.5 w-3.5" aria-hidden />, label: 'CPU 温度（Package 0）', value: status.system.cpuTemperature === null ? '--' : `${status.system.cpuTemperature} °C` },
    {
      icon: <MemoryStick className="h-3.5 w-3.5" aria-hidden />,
      label: '内存',
      value: `${formatNumber(status.system.memoryUsedGb)} / ${formatNumber(status.system.memoryTotalGb)} GB（${formatPercentage(status.system.memoryUsage)}）`,
    },
    {
      icon: <HardDrive className="h-3.5 w-3.5" aria-hidden />,
      label: '磁盘',
      value: `${formatInt(status.system.diskUsedGb)} / ${formatInt(status.system.diskTotalGb)} GB（${formatPercentage(status.system.diskUsage)}）`,
    },
    { icon: <Usb className="h-3.5 w-3.5" aria-hidden />, label: '底盘串口', value: '/dev/sparkBase' },
    { icon: <Radio className="h-3.5 w-3.5" aria-hidden />, label: '雷达串口', value: '/dev/ydlidar' },
  ]

  return (
    <PageShell>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        {/* 左：机器人列表 */}
        <Panel scroll className="xl:col-span-4">
          <PanelHead icon={<Bot className="h-4 w-4" aria-hidden />} title="机器人列表（1）" extra={<Badge tone="brand">在线 1</Badge>} />

          <div className="space-y-2.5 p-3">
            <div className="rounded-xl border-2 border-brand-200 bg-brand-50/40 p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <SparkLogo size={30} withText={false} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{status.name}</p>
                    <Badge tone="success" dot>在线</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">实验室主机器人</p>
                </div>
              </div>

              <dl className="mt-3 space-y-1.5 text-xs">
                {[
                  ['IP 地址', status.network.ip ?? '--'],
                  ['ROS 版本', 'ROS1 Noetic'],
                  ['rosbridge', 'ws://192.168.3.18:9090'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <dt className="shrink-0 text-ink-muted">{label}</dt>
                    <dd className="truncate font-mono text-[11px] text-ink-soft">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3" aria-hidden />
                  电量 --
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wifi className="h-3 w-3" aria-hidden />
                  延迟 {status.network.latencyMs ?? '--'} ms
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" block>进入控制台</Button>
                <Button size="sm" variant="secondary" block icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}>
                  连接测试
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-line-strong p-3 text-center text-xs text-ink-muted">
              <PlusHint />
            </div>
          </div>
        </Panel>

        {/* 右：设备详情 */}
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 xl:col-span-8">
          <Panel>
            <div className="scroll-thin flex items-center gap-1 overflow-x-auto px-2 py-1.5">
              {TABS.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    index === 0 ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-slate-50 hover:text-ink',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Panel>

          <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel scroll>
              <PanelHead icon={<Settings2 className="h-4 w-4" aria-hidden />} title="基本信息" />
              <dl className="divide-y divide-line">
                {basicInfo.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-4 py-1.5">
                    <dt className="shrink-0 text-xs text-ink-muted">{label}</dt>
                    <dd className="truncate text-xs font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel scroll>
              <PanelHead
                icon={<Cpu className="h-4 w-4" aria-hidden />}
                title="系统资源"
                extra={<span className="text-[11px] text-ink-muted">1 Hz 刷新</span>}
              />
              <ul className="divide-y divide-line">
                {systemRows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3 px-4 py-1.5">
                    <span className="inline-flex shrink-0 items-center gap-2 text-xs text-ink-muted">
                      {row.icon}
                      {row.label}
                    </span>
                    <span className="truncate font-mono text-[11px] font-medium text-ink">{row.value}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel>
              <PanelHead
                icon={<Zap className="h-4 w-4" aria-hidden />}
                title="电源状态"
                extra={<Badge tone="muted">待底盘确认</Badge>}
              />
              <div className="grid grid-cols-2 gap-2 p-3">
                {[
                  ['电池百分比', '--'],
                  ['电压', '--'],
                  ['电流', '--'],
                  ['电池温度', '--'],
                  ['充电状态', '--'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line bg-slate-50 px-2.5 py-2">
                    <p className="text-[11px] text-ink-muted">{label}</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel scroll>
              <PanelHead
                icon={<Radio className="h-4 w-4" aria-hidden />}
                title="传感器状态"
                extra={
                  <button type="button" className="inline-flex items-center gap-1 text-[11px] text-brand-700 hover:underline">
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    刷新
                  </button>
                }
              />
              <ul className="divide-y divide-line">
                {SENSOR_ROWS.map((row) => {
                  const tone = STATE_TONE[row.state]
                  return (
                    <li key={row.name} className="flex items-center justify-between gap-3 px-4 py-[7px]">
                      <span className="inline-flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                        {row.icon}
                        {row.name}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-2 text-xs">
                        <span className="text-[11px] text-ink-muted">{row.extra}</span>
                        <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} aria-hidden />
                        <span className={cn('w-10 shrink-0 whitespace-nowrap text-right text-[11px]', tone.text)}>{tone.label}</span>
                        <ChevronRight className="h-3 w-3 text-ink-muted" aria-hidden />
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Panel>

            <Panel scroll>
              <PanelHead
                icon={<Settings2 className="h-4 w-4" aria-hidden />}
                title="ROS 连接配置"
                extra={<Button size="sm" variant="secondary" icon={<Save className="h-3 w-3" aria-hidden />}>保存</Button>}
              />
              <div className="space-y-2.5 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted">ROS 版本</span>
                  <div className="flex gap-1.5">
                    <Badge tone="muted">ROS1 Noetic</Badge>
                    <Badge tone="brand">ROS2 Humble</Badge>
                  </div>
                </div>
                {[
                  ['机器人 IP 地址', status.network.ip ?? '--'],
                  ['rosbridge 地址', 'ws://192.168.3.18:9090'],
                  ['ROS 命名空间', '/spark01'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-ink-muted">{label}</span>
                    <span className="field-control flex h-9 flex-1 items-center font-mono text-xs">{value}</span>
                  </div>
                ))}

                <div className="rounded-lg border border-line bg-slate-50 p-2.5">
                  <p className="mb-1.5 text-xs font-medium text-ink">连接测试</p>
                  <ul className="space-y-1">
                    {[
                      ['网络连通性（Ping）', '12 ms'],
                      ['rosbridge 连接', '成功'],
                      ['ROS 节点通信', '成功'],
                      ['话题发布/订阅', '正常'],
                    ].map(([label, value]) => (
                      <li key={label} className="flex items-center justify-between text-[11px]">
                        <span className="text-ink-muted">{label}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                          {value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHead icon={<Timer className="h-4 w-4" aria-hidden />} title="关键接口就绪状态" />
              <ul className="space-y-1.5 p-3">
                {[
                  ['/spark_web/status', true],
                  ['/spark_web/pose', true],
                  ['/spark_web/velocity', true],
                  ['/spark_web/diagnostics', true],
                  ['/spark_web/power', false],
                ].map(([name, ready]) => (
                  <li key={name as string} className="flex items-center justify-between gap-2 text-xs">
                    <code className="truncate font-mono text-[11px] text-ink-soft">{name as string}</code>
                    <Badge tone={ready ? 'success' : 'muted'}>{ready ? 'Ready' : '待确认'}</Badge>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function PlusHint() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-line-strong text-ink-muted">+</span>
      添加机器人（基本信息 → ROS 连接 → 功能检测 → 完成）
    </span>
  )
}
