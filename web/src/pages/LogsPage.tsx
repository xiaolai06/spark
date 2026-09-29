import { useState } from 'react'
import {
  Download,
  FileBarChart,
  FileText,
  Filter,
  PlayCircle,
  ScrollText,
  Siren,
  UserRound,
} from 'lucide-react'
import { PageShell, Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'tasks', label: '任务记录', icon: FileText },
  { key: 'alerts', label: '异常告警', icon: Siren },
  { key: 'reports', label: '巡检报告', icon: FileBarChart },
  { key: 'logs', label: '操作日志', icon: ScrollText },
] as const

type TabKey = (typeof TABS)[number]['key']

const TASKS = [
  { id: 'T20260929001', name: '实验室日常巡检', type: '巡检', status: '执行中', tone: 'success' as const, start: '2026-09-29 14:24', duration: '00:04:32', alerts: 0 },
  { id: 'T20260929002', name: '晚间安全巡检', type: '巡检', status: '已完成', tone: 'brand' as const, start: '2026-09-29 10:00', duration: '00:12:35', alerts: 1 },
  { id: 'T20260929003', name: '前往实验台 A', type: '导航', status: '已完成', tone: 'brand' as const, start: '2026-09-29 09:42', duration: '00:00:48', alerts: 0 },
  { id: 'T20260928001', name: '实验设备专项检查', type: '巡检', status: '异常', tone: 'danger' as const, start: '2026-09-28 16:20', duration: '00:08:21', alerts: 1 },
  { id: 'T20260928002', name: '周间行巡检', type: '巡检', status: '已完成', tone: 'brand' as const, start: '2026-09-28 10:00', duration: '00:11:08', alerts: 0 },
  { id: 'T20260928003', name: '自定义巡检任务', type: '巡检', status: '已完成', tone: 'brand' as const, start: '2026-09-28 15:30', duration: '00:09:56', alerts: 0 },
]

const ALERTS = [
  { id: 'E001', title: '通道存在障碍物', level: '高', tone: 'danger' as const, robot: 'Spark-01', place: '实验台B区域', time: '2026-09-29 14:27:53', handled: '未处理' },
  { id: 'E002', title: '物品未在位', level: '中', tone: 'warning' as const, robot: 'Spark-01', place: '器材区', time: '2026-09-29 14:12:18', handled: '未处理' },
  { id: 'E003', title: '检测到人员滞留', level: '中', tone: 'warning' as const, robot: 'Spark-01', place: '门口区域', time: '2026-09-28 16:35:02', handled: '已处理' },
  { id: 'E004', title: '设备异常（温度过高）', level: '高', tone: 'danger' as const, robot: 'Spark-01', place: '实验台A', time: '2026-09-28 10:14:25', handled: '已处理' },
]

const REPORTS = [
  { id: 'R001', name: '晚间安全巡检报告', period: '2026-09-29 10:00 ~ 10:12', items: 4, alerts: 1, size: '1.2 MB' },
  { id: 'R002', name: '实验室日常巡检报告', period: '2026-09-28 14:00 ~ 14:09', items: 5, alerts: 1, size: '1.4 MB' },
  { id: 'R003', name: '周间行巡检报告', period: '2026-09-28 10:00 ~ 10:11', items: 6, alerts: 0, size: '1.1 MB' },
]

const OPERATION_LOGS = [
  { id: 'L001', user: '学生用户', action: '登录系统', target: 'Web 控制台', time: '2026-09-29 14:28:16', result: '成功', tone: 'success' as const },
  { id: 'L002', user: '学生用户', action: '下发导航目标', target: '实验台 A', time: '2026-09-29 14:28:14', result: '成功', tone: 'success' as const },
  { id: 'L003', user: '学生用户', action: '启动巡检任务', target: '实验室日常巡检', time: '2026-09-29 14:24:02', result: '成功', tone: 'success' as const },
  { id: 'L004', user: '学生用户', action: '修改个人资料', target: '手机号', time: '2026-09-28 18:11:20', result: '成功', tone: 'success' as const },
  { id: 'L005', user: '未知设备', action: '尝试连接', target: '192.168.3.99', time: '2026-09-28 03:22:41', result: '失败', tone: 'danger' as const },
]

function TableShell({ children, head }: { children: React.ReactNode; head: string[] }) {
  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-line text-ink-muted">
            {head.map((item) => (
              <th key={item} className="whitespace-nowrap px-3 py-2 font-medium">
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

/** 任务与日志（第二期） */
export function LogsPage() {
  const [tab, setTab] = useState<TabKey>('tasks')

  return (
    <PageShell>
      <Panel className="shrink-0">
        <div className="flex flex-wrap items-center gap-2 px-2.5 py-2">
          <div className="flex items-center gap-1">
            {TABS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    tab === item.key ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-slate-50 hover:text-ink',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              containerClassName="w-28"
              className="h-8 text-xs"
              aria-label="机器人筛选"
              defaultValue="spark-01"
              options={[
                { value: 'all', label: '全部机器人' },
                { value: 'spark-01', label: 'Spark-01' },
              ]}
            />
            <Select
              containerClassName="w-24"
              className="h-8 text-xs"
              aria-label="类型筛选"
              defaultValue="all"
              options={[
                { value: 'all', label: '全部类型' },
                { value: 'patrol', label: '巡检' },
                { value: 'nav', label: '导航' },
              ]}
            />
            <Input containerClassName="w-36" className="h-8 text-xs" placeholder="开始时间" aria-label="开始时间" />
            <Button size="sm" variant="secondary" icon={<Filter className="h-3.5 w-3.5" aria-hidden />}>
              筛选
            </Button>
          </div>
        </div>
      </Panel>

      <Panel className="min-h-0 flex-1">
        {tab === 'tasks' ? (
          <>
            <PanelHead
              icon={<FileText className="h-4 w-4" aria-hidden />}
              title="任务记录"
              extra={
                <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" aria-hidden />}>
                  导出
                </Button>
              }
            />
            <TableShell head={['任务编号', '任务名称', '类型', '状态', '开始时间', '时长', '异常', '操作']}>
              {TASKS.map((task) => (
                <tr key={task.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{task.id}</td>
                  <td className="px-3 py-2 text-ink-soft">{task.name}</td>
                  <td className="px-3 py-2 text-ink-muted">{task.type}</td>
                  <td className="px-3 py-2">
                    <Badge tone={task.tone}>{task.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{task.start}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{task.duration}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink-muted">{task.alerts}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-[11px] text-brand-700">
                      <button type="button" className="hover:underline">详情</button>
                      <button type="button" className="hover:underline">回放</button>
                    </span>
                  </td>
                </tr>
              ))}
            </TableShell>
          </>
        ) : null}

        {tab === 'alerts' ? (
          <>
            <PanelHead icon={<Siren className="h-4 w-4" aria-hidden />} title="异常告警" />
            <TableShell head={['编号', '异常内容', '级别', '机器人', '位置', '发生时间', '处理状态']}>
              {ALERTS.map((alert) => (
                <tr key={alert.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{alert.id}</td>
                  <td className="px-3 py-2 text-ink-soft">{alert.title}</td>
                  <td className="px-3 py-2">
                    <Badge tone={alert.tone}>{alert.level}</Badge>
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{alert.robot}</td>
                  <td className="px-3 py-2 text-ink-muted">{alert.place}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{alert.time}</td>
                  <td className="px-3 py-2">
                    <Badge tone={alert.handled === '已处理' ? 'success' : 'muted'}>{alert.handled}</Badge>
                  </td>
                </tr>
              ))}
            </TableShell>
          </>
        ) : null}

        {tab === 'reports' ? (
          <>
            <PanelHead
              icon={<FileBarChart className="h-4 w-4" aria-hidden />}
              title="巡检报告"
              extra={
                <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" aria-hidden />}>
                  批量导出
                </Button>
              }
            />
            <TableShell head={['报告编号', '报告名称', '巡检时段', '检查项', '异常数', '文件大小', '操作']}>
              {REPORTS.map((report) => (
                <tr key={report.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{report.id}</td>
                  <td className="px-3 py-2 text-ink-soft">{report.name}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{report.period}</td>
                  <td className="px-3 py-2 font-mono text-ink-muted">{report.items}</td>
                  <td className="px-3 py-2 font-mono text-ink-muted">{report.alerts}</td>
                  <td className="px-3 py-2 font-mono text-ink-muted">{report.size}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-[11px] text-brand-700">
                      <button type="button" className="hover:underline">查看</button>
                      <button type="button" className="hover:underline">下载</button>
                    </span>
                  </td>
                </tr>
              ))}
            </TableShell>
          </>
        ) : null}

        {tab === 'logs' ? (
          <>
            <PanelHead icon={<ScrollText className="h-4 w-4" aria-hidden />} title="操作日志" extra={<Badge tone="muted">可追溯到操作人</Badge>} />
            <TableShell head={['编号', '操作人', '操作类型', '操作对象', '时间', '结果']}>
              {OPERATION_LOGS.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{log.id}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 text-ink-soft">
                      <UserRound className="h-3 w-3 text-ink-muted" aria-hidden />
                      {log.user}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-ink-soft">{log.action}</td>
                  <td className="px-3 py-2 text-ink-muted">{log.target}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink-muted">{log.time}</td>
                  <td className="px-3 py-2">
                    <Badge tone={log.tone}>{log.result}</Badge>
                  </td>
                </tr>
              ))}
            </TableShell>
          </>
        ) : null}
      </Panel>

      <p className="flex shrink-0 items-center justify-center gap-1.5 text-[11px] text-ink-muted">
        <PlayCircle className="h-3 w-3" aria-hidden />
        任务与日志为第二期功能：当前为界面与数据结构预览，接口（{`/api/v1/logs`}、{`/api/v1/robots/{robotId}/events`}）待接入
      </p>
    </PageShell>
  )
}
