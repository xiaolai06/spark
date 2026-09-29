import { useState } from 'react'
import {
  Bot,
  Camera,
  CheckCircle2,
  FileText,
  Mic,
  Play,
  Sparkles,
  Star,
  Target,
  Volume2,
  Workflow,
  Zap,
} from 'lucide-react'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useRobotStore } from '@/store/robot'

const QUICK_COMMANDS = [
  { label: '去实验台A', icon: Target, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { label: '去器材区', icon: Star, tone: 'border-violet-200 bg-violet-50 text-violet-700' },
  { label: '开始巡检', icon: Play, tone: 'border-brand-200 bg-brand-50 text-brand-700' },
  { label: '寻找红色工具箱', icon: Zap, tone: 'border-red-200 bg-red-50 text-red-700' },
  { label: '回起点', icon: Bot, tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  { label: '检查实验台B', icon: FileText, tone: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
  { label: '拍摄周围环境', icon: Camera, tone: 'border-slate-200 bg-slate-50 text-slate-700' },
  { label: '返回充电桩', icon: Zap, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
]

const FLOW_STEPS = [
  { title: '语音识别', desc: '将语音转换为文字，识别您的指令内容', icon: Mic, tone: 'bg-brand-50 text-brand-600' },
  { title: '任务理解', desc: '基于大模型理解意图，提取关键信息', icon: FileText, tone: 'bg-emerald-50 text-emerald-600' },
  { title: '导航 / 视觉 / 机械臂', desc: '调用相应功能模块执行导航、巡检或操作', icon: Workflow, tone: 'bg-violet-50 text-violet-600' },
  { title: '任务完成', desc: '完成任务并反馈结果，返回执行状态', icon: CheckCircle2, tone: 'bg-amber-50 text-amber-600' },
]

/** 语音交互：复用在机器人本机的 spark_voice 识别能力 */
export function VoicePage() {
  const records = useRobotStore((state) => state.voiceRecords)
  const [listening, setListening] = useState(false)

  return (
    <PageShell>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        {/* 语音输入 */}
        <Panel className="xl:col-span-7">
          <PanelHead
            icon={<Mic className="h-4 w-4" aria-hidden />}
            title="语音输入"
            extra={<Badge tone={listening ? 'warning' : 'muted'} dot>{listening ? '识别中…' : '待命'}</Badge>}
          />

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-4">
            {/* 波形 */}
            <div className="flex h-16 w-full max-w-md items-center justify-center gap-[3px]" aria-hidden>
              {Array.from({ length: 56 }).map((_, index) => {
                const height = listening ? 8 + Math.abs(Math.sin(index * 0.7)) * 40 : 6 + Math.abs(Math.cos(index * 0.5)) * 10
                return (
                  <span
                    key={index}
                    className={cn('w-[3px] rounded-full transition-all', listening ? 'bg-brand-500' : 'bg-brand-200')}
                    style={{ height: `${height}px` }}
                  />
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setListening((value) => !value)}
              aria-pressed={listening}
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/25 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {listening ? (
                <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" aria-hidden />
              ) : null}
              <Mic className="h-9 w-9" aria-hidden />
            </button>

            <p className="text-sm font-medium text-ink">{listening ? '正在聆听…' : '点击开始语音输入'}</p>
            <p className="text-center text-xs text-ink-muted">
              请说出您的指令，例如：“去实验台A”、“开始巡检”
            </p>

            <div className="mt-1 w-full max-w-md rounded-xl border border-line bg-slate-50 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
                <Volume2 className="h-3 w-3" aria-hidden />
                实时识别结果
              </p>
              <p className="flex items-center gap-2 text-base font-semibold text-ink">
                <span className="min-w-0 flex-1 truncate">“去实验台 A”</span>
                <Badge tone="brand">机器人本机</Badge>
              </p>
            </div>
          </div>
        </Panel>

        {/* 指令解析结果 */}
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 xl:col-span-5">
          <Panel>
            <PanelHead
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
              title="指令解析结果"
              extra={<Badge tone="brand">导航任务</Badge>}
            />
            <dl className="divide-y divide-line">
              {[
                ['意图识别', '前往指定位置'],
                ['目标地点', '实验台 A'],
                ['目标物体', '-', '无'],
                ['执行动作', '导航前往'],
              ].map(([label, value, hint]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-4 py-2">
                  <dt className="shrink-0 text-xs text-ink-muted">{label}</dt>
                  <dd className="flex items-center gap-1.5 truncate text-xs font-medium text-brand-700">
                    {value}
                    {hint ? <Badge tone="muted">{hint}</Badge> : null}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 px-4 py-2">
                <dt className="shrink-0 text-xs text-ink-muted">置信度</dt>
                <dd className="flex items-center gap-2">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                    <span className="block h-full w-[96%] rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink">96%</span>
                </dd>
              </div>
            </dl>
            <div className="m-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-emerald-700">指令已成功理解</p>
                <p className="mt-0.5 text-[11px] text-emerald-700/80">系统已解析您的语音指令，准备执行相应任务。</p>
              </div>
            </div>
          </Panel>

          <Panel scroll>
            <PanelHead icon={<Mic className="h-4 w-4" aria-hidden />} title="最近语音记录" />
            <ul className="divide-y divide-line">
              {records.map((record) => (
                <li key={record.id} className="flex items-center gap-2.5 px-4 py-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                  <span className="font-mono text-[11px] text-ink-muted">{record.time}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">“{record.text}”</span>
                  <span className="shrink-0 truncate text-[11px] text-ink-muted">{record.intent ?? '--'}</span>
                  <Badge tone={record.status === 'rejected' ? 'danger' : 'success'}>
                    {record.status === 'rejected' ? '已拒绝' : '解析成功'}
                  </Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* 快速指令 + 执行流程 */}
      <div className="grid min-h-0 shrink-0 grid-cols-1 gap-3 xl:grid-cols-12 xl:h-[15rem]">
        <Panel scroll className="xl:col-span-5">
          <PanelHead icon={<Zap className="h-4 w-4" aria-hidden />} title="快速语音指令" extra={<button type="button" className="text-[11px] text-brand-700 hover:underline">使用说明</button>} />
          <div className="grid grid-cols-2 gap-2 p-3">
            {QUICK_COMMANDS.map((command) => {
              const Icon = command.icon
              return (
                <button
                  key={command.label}
                  type="button"
                  onClick={() => setListening(false)}
                  className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-transform active:scale-[0.98]', command.tone)}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{command.label}</span>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel scroll className="xl:col-span-7">
          <PanelHead icon={<Workflow className="h-4 w-4" aria-hidden />} title="语音指令执行流程" />
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW_STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="relative flex gap-2.5 rounded-lg border border-line bg-slate-50 p-2.5">
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', step.tone)}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="px-3 pb-3 text-[11px] text-ink-muted">
            说明：识别由机器人本机完成，本页只订阅统一语音事件；命令执行经过唯一任务入口，重连不会重放历史语音命令。
          </p>
        </Panel>
      </div>
    </PageShell>
  )
}
