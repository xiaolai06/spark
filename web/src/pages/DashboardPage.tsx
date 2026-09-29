import { useEffect } from 'react'
import { ActivityPanel, VoicePanel } from '@/components/dashboard/ActivityPanel'
import { CameraPanel } from '@/components/dashboard/CameraPanel'
import { MapPanel } from '@/components/dashboard/MapPanel'
import { QuickControlPanel } from '@/components/dashboard/QuickControlPanel'
import { StatusPanel } from '@/components/dashboard/StatusPanel'
import { PageShell } from '@/components/layout/PageShell'
import { useRobotStore } from '@/store/robot'

/**
 * 总览控制台。
 *
 * 布局对齐 UI/01-dashboard.png，去掉页面级标题与时间（时间统一在顶栏），
 * 整个页面锁定一屏高度，超出部分在面板内部滚动。
 */
export function DashboardPage() {
  const status = useRobotStore((state) => state.status)
  const activity = useRobotStore((state) => state.activity)
  const voiceRecords = useRobotStore((state) => state.voiceRecords)
  const init = useRobotStore((state) => state.init)

  useEffect(() => init(), [init])

  return (
    <PageShell>
      {/* 主区：左 8 栏地图 + 右 4 栏状态/控制/语音 */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,15rem)] gap-3 xl:col-span-8">
          <MapPanel />
          <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-5">
            <div className="min-h-0 lg:col-span-2">
              <CameraPanel />
            </div>
            <div className="min-h-0 lg:col-span-3">
              <ActivityPanel events={activity} />
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-3 xl:col-span-4">
          <StatusPanel status={status} />
          <QuickControlPanel />
          <VoicePanel records={voiceRecords} />
        </div>
      </div>
    </PageShell>
  )
}
