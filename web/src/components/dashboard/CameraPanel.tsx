import { Camera, Maximize2, Radio } from 'lucide-react'
import { Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'

/** 前置摄像头占位：真实视频由 web_video_server 提供 MJPEG */
export function CameraPanel({ height = 'h-full' }: { height?: string }) {
  return (
    <Panel className={height}>
      <PanelHead
        icon={<Camera className="h-4 w-4" aria-hidden />}
        title="前置摄像头画面"
        extra={
          <div className="flex items-center gap-1.5">
            <Badge tone="success" dot>实时</Badge>
            <button
              type="button"
              aria-label="全屏"
              className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-muted transition-colors hover:bg-slate-100"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        }
      />

      <div className="relative min-h-0 flex-1 bg-slate-900">
        <div className="flex h-full items-center justify-center px-3">
          <div className="text-center">
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80">
              <Radio className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-1.5 text-xs font-medium text-white/85">摄像头画面占位</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-white/50">
              RealSense D435 · RGB 1920×1080
              <br />
              接入后由 web_video_server 提供 MJPEG
            </p>
          </div>
        </div>
        <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] text-white/85">
          1920 × 1080 · 30 FPS
        </span>
        <Badge tone="warning" className="absolute right-2 top-2">未接真机</Badge>
      </div>
    </Panel>
  )
}
