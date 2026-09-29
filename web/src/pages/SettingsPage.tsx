import { useState } from 'react'
import {
  Bell,
  Check,
  Globe,
  Info,
  Mic,
  Monitor,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Video,
  Zap,
} from 'lucide-react'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { SparkLogo } from '@/components/SparkLogo'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const SECTIONS = [
  { key: 'platform', label: '平台配置', icon: Monitor, active: true },
  { key: 'ros', label: 'ROS通信', icon: Globe, active: false },
  { key: 'voice', label: '语音设置', icon: Mic, active: false },
  { key: 'vision', label: '视觉设置', icon: Video, active: false },
  { key: 'safety', label: '安全策略', icon: ShieldCheck, active: false },
  { key: 'notify', label: '通知设置', icon: Bell, active: false },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

const TIPS = [
  '根据实验环境和实际需求配置各项参数，建议保持默认设置。',
  '修改设置后点击「保存设置」使配置生效。',
  '如遇连接或功能异常，可先进行「测试连接」或查看右侧提示。',
  '重要的安全参数（急停时间、安全距离）请根据实际场地环境谨慎设置。',
]

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-slate-300')}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
          checked ? 'left-[1.15rem]' : 'left-0.5',
        )}
      />
    </button>
  )
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

/** 系统设置（第二期）：只负责配置展示，保存后需真正作用于后端与机器人 */
export function SettingsPage() {
  const [section, setSection] = useState<SectionKey>('platform')
  const [saved, setSaved] = useState(false)
  const [switches, setSwitches] = useState({ mail: true, web: true, alert: true, patrolStop: true })
  const user = useAuthStore((state) => state.user)

  const toggle = (key: keyof typeof switches) => (value: boolean) => {
    setSwitches((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  return (
    <PageShell>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        {/* 左侧分区导航 */}
        <Panel className="xl:col-span-3">
          <PanelHead icon={<Settings2 className="h-4 w-4" aria-hidden />} title="设置分区" />
          <ul className="space-y-0.5 p-2">
            {SECTIONS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => setSection(item.key)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                      section === item.key
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-soft hover:bg-slate-50 hover:text-ink',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-line p-3">
            <SparkLogo size={34} subtitle={`${user?.name ?? '--'} · ${user?.department ?? '--'}`} />
          </div>
        </Panel>

        {/* 中间配置区 */}
        <div className="scroll-thin min-h-0 space-y-3 overflow-y-auto pr-0.5 xl:col-span-6">
          {section === 'platform' ? (
            <>
              <Panel>
                <PanelHead icon={<Monitor className="h-4 w-4" aria-hidden />} title="平台配置" extra={<span className="text-[11px] text-ink-muted">配置平台的基本信息与使用偏好</span>} />
                <div className="space-y-3 p-4">
                  <SettingRow label="平台名称" hint="将在页面标题和顶部导航栏中显示">
                    <Input containerClassName="w-64" className="h-9 text-xs" defaultValue="Spark 轮足机器人实验平台" />
                  </SettingRow>
                  <SettingRow label="默认机器人">
                    <Select
                      containerClassName="w-64"
                      className="h-9 text-xs"
                      defaultValue="spark-01"
                      options={[{ value: 'spark-01', label: 'Spark-01（实验室主机器人）' }]}
                    />
                  </SettingRow>
                  <SettingRow label="界面主题">
                    <div className="flex gap-1.5">
                      <Badge tone="brand" className="cursor-pointer !px-3 !py-1.5">☀ 浅色主题</Badge>
                      <Badge tone="muted" className="cursor-pointer !px-3 !py-1.5">🌙 深色主题</Badge>
                    </div>
                  </SettingRow>
                  <SettingRow label="系统语言">
                    <Select
                      containerClassName="w-40"
                      className="h-9 text-xs"
                      defaultValue="zh-CN"
                      options={[{ value: 'zh-CN', label: '简体中文' }]}
                    />
                  </SettingRow>
                </div>
              </Panel>
            </>
          ) : null}

          {section === 'ros' ? (
            <Panel>
              <PanelHead icon={<Globe className="h-4 w-4" aria-hidden />} title="ROS 通信" extra={<span className="text-[11px] text-ink-muted">配置与机器人的通信参数</span>} />
              <div className="space-y-3 p-4">
                <SettingRow label="ROSBridge 地址" hint="例如：ws://192.168.1.82:9090">
                  <Input containerClassName="w-64" className="h-9 font-mono text-xs" defaultValue="ws://192.168.3.18:9090" />
                </SettingRow>
                <SettingRow label="命名空间" hint="ROS 话题与服务的命名空间">
                  <Input containerClassName="w-64" className="h-9 font-mono text-xs" defaultValue="/spark" />
                </SettingRow>
                <SettingRow label="重连策略">
                  <Select
                    containerClassName="w-40"
                    className="h-9 text-xs"
                    defaultValue="auto"
                    options={[
                      { value: 'auto', label: '自动重连（推荐）' },
                      { value: 'manual', label: '手动重连' },
                    ]}
                  />
                </SettingRow>
                <SettingRow label="心跳间隔" hint="用于检测连接状态，建议 1-5 秒">
                  <div className="flex items-center gap-1.5">
                    <Input containerClassName="w-20" className="h-9 text-xs" defaultValue="3" />
                    <span className="text-xs text-ink-muted">秒</span>
                  </div>
                </SettingRow>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-slate-50 px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    连接成功
                    <span className="font-mono text-[11px] text-ink-muted">延迟 12 ms</span>
                  </span>
                  <Button size="sm" variant="secondary" icon={<Zap className="h-3.5 w-3.5" aria-hidden />}>
                    测试连接
                  </Button>
                </div>
              </div>
            </Panel>
          ) : null}

          {section === 'voice' ? (
            <Panel>
              <PanelHead icon={<Mic className="h-4 w-4" aria-hidden />} title="语音设置" extra={<span className="text-[11px] text-ink-muted">配置语音识别与语音合成功能</span>} />
              <div className="space-y-3 p-4">
                <SettingRow label="语音识别模式">
                  <div className="flex gap-1.5">
                    <Badge tone="brand" className="cursor-pointer !px-3 !py-1.5">● 在线识别（高精度）</Badge>
                    <Badge tone="muted" className="cursor-pointer !px-3 !py-1.5">○ 离线识别（低延迟）</Badge>
                  </div>
                </SettingRow>
                <SettingRow label="唤醒词" hint="机器人唤醒时使用的关键词">
                  <Input containerClassName="w-64" className="h-9 text-xs" defaultValue="你好，小 Spark" />
                </SettingRow>
                <SettingRow label="麦克风灵敏度">
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} defaultValue={70} className="w-40 accent-brand-600" aria-label="麦克风灵敏度" />
                    <span className="font-mono text-xs text-ink">70%</span>
                  </div>
                </SettingRow>
                <SettingRow label="TTS 发音人">
                  <Select
                    containerClassName="w-40"
                    className="h-9 text-xs"
                    defaultValue="standard"
                    options={[{ value: 'standard', label: '标准女声（普通话）' }]}
                  />
                </SettingRow>
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" icon={<Mic className="h-3.5 w-3.5" aria-hidden />}>试听</Button>
                </div>
              </div>
            </Panel>
          ) : null}

          {section === 'vision' ? (
            <Panel>
              <PanelHead icon={<Video className="h-4 w-4" aria-hidden />} title="视觉设置" extra={<span className="text-[11px] text-ink-muted">配置相机与识别相关参数</span>} />
              <div className="space-y-3 p-4">
                <SettingRow label="默认相机">
                  <Select
                    containerClassName="w-64"
                    className="h-9 text-xs"
                    defaultValue="front"
                    options={[{ value: 'front', label: '前置深度相机（/camera/front）' }]}
                  />
                </SettingRow>
                <SettingRow label="置信度阈值" hint="用于目标检测/识别的置信度阈值（0-1）">
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} defaultValue={50} className="w-40 accent-brand-600" aria-label="置信度阈值" />
                    <span className="font-mono text-xs text-ink">0.50</span>
                  </div>
                </SettingRow>
                <SettingRow label="图像存储路径" hint="巡检、识别等任务的图像保存路径">
                  <Input containerClassName="w-64" className="h-9 font-mono text-xs" defaultValue="/data/images" />
                </SettingRow>
              </div>
            </Panel>
          ) : null}

          {section === 'safety' ? (
            <Panel>
              <PanelHead icon={<ShieldCheck className="h-4 w-4" aria-hidden />} title="安全策略" extra={<Badge tone="danger">影响真机行为</Badge>} />
              <div className="space-y-3 p-4">
                <SettingRow label="急停超时时间" hint="检测到异常时自动触发的停机制时间">
                  <div className="flex items-center gap-1.5">
                    <Input containerClassName="w-20" className="h-9 text-xs" defaultValue="5" />
                    <span className="text-xs text-ink-muted">秒</span>
                  </div>
                </SettingRow>
                <SettingRow label="手动速度上限" hint="手动遥控模式下的最大移动速度">
                  <div className="flex items-center gap-1.5">
                    <Input containerClassName="w-20" className="h-9 text-xs" defaultValue="0.50" />
                    <span className="text-xs text-ink-muted">m/s</span>
                  </div>
                </SettingRow>
                <SettingRow label="障碍物安全距离" hint="低于该距离时触发避障或减速">
                  <div className="flex items-center gap-1.5">
                    <Input containerClassName="w-20" className="h-9 text-xs" defaultValue="0.30" />
                    <span className="text-xs text-ink-muted">m</span>
                  </div>
                </SettingRow>
                <SettingRow label="巡检异常自动停止" hint="检测到障碍物或威胁时自动中止任务">
                  <Switch checked={switches.patrolStop} onChange={toggle('patrolStop')} label="巡检异常自动停止" />
                </SettingRow>
              </div>
            </Panel>
          ) : null}

          {section === 'notify' ? (
            <Panel>
              <PanelHead icon={<Bell className="h-4 w-4" aria-hidden />} title="通知设置" extra={<span className="text-[11px] text-ink-muted">配置消息通知与异常提醒方式</span>} />
              <div className="space-y-3 p-4">
                <SettingRow label="邮件通知" hint="发生异常事件时发送邮件提醒">
                  <Switch checked={switches.mail} onChange={toggle('mail')} label="邮件通知" />
                </SettingRow>
                <SettingRow label="Web 通知" hint="在页面右上角显示通知消息">
                  <Switch checked={switches.web} onChange={toggle('web')} label="Web 通知" />
                </SettingRow>
                <SettingRow label="异常事件提醒" hint="包括机器人超时、低电量、任务失败等">
                  <Switch checked={switches.alert} onChange={toggle('alert')} label="异常事件提醒" />
                </SettingRow>
                <SettingRow label="通知邮箱" hint="用于接收平台通知的邮箱地址">
                  <Input containerClassName="w-64" className="h-9 text-xs" defaultValue={user?.email ?? ''} />
                </SettingRow>
              </div>
            </Panel>
          ) : null}
        </div>

        {/* 右侧提示与保存 */}
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 xl:col-span-3">
          <Panel scroll>
            <PanelHead icon={<Info className="h-4 w-4" aria-hidden />} title="操作提示" />
            <ol className="space-y-3 p-4">
              {TIPS.map((tip, index) => (
                <li key={tip} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-[11px] font-semibold text-brand-600">
                    {index + 1}
                  </span>
                  <p className="text-[11px] leading-relaxed text-ink-soft">{tip}</p>
                </li>
              ))}
            </ol>
            <div className="m-4 rounded-lg border border-dashed border-line-strong bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-ink-muted">
              系统设置仅用于配置展示。第二期接入 Settings API 后，保存的限速、安全距离与急停超时才会真正作用于后端与机器人。
            </div>
          </Panel>

          <div className="space-y-2">
            <Button
              block
              icon={saved ? <Check className="h-4 w-4" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              onClick={() => setSaved(true)}
            >
              {saved ? '已保存（待接入后端）' : '保存设置'}
            </Button>
            <Button variant="secondary" block icon={<RefreshCw className="h-4 w-4" aria-hidden />}>
              恢复默认设置
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
