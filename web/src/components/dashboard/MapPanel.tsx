import { Crosshair, Layers, Minus, Plus } from 'lucide-react'
import { Panel, PanelHead } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/Card'

/**
 * 实验室地图。
 *
 * 真实数据来自 GET /api/v1/robots/{id}/map（OccupancyGrid），
 * 当前后端尚未接入真实地图，这里用静态 SVG 还原参考图排版与图元关系。
 */
const WAYPOINTS = [
  { id: 'start', label: '起点', x: 150, y: 372, fill: '#fef2f2', stroke: '#fecaca', dot: '#ef4444', text: '#dc2626' },
  { id: 'lab-b', label: '实验台B', x: 300, y: 118, fill: '#eff6ff', stroke: '#bfdbfe', dot: '#2563eb', text: '#1d4ed8' },
  { id: 'lab-a', label: '实验台A', x: 500, y: 118, fill: '#ecfdf5', stroke: '#a7f3d0', dot: '#059669', text: '#047857' },
  { id: 'equip', label: '器材区', x: 214, y: 250, fill: '#f5f3ff', stroke: '#ddd6fe', dot: '#7c3aed', text: '#6d28d9' },
  { id: 'door', label: '门口', x: 600, y: 330, fill: '#fff7ed', stroke: '#fed7aa', dot: '#ea580c', text: '#c2410c' },
  { id: 'charge', label: '充电区', x: 618, y: 250, fill: '#eff6ff', stroke: '#bfdbfe', dot: '#2563eb', text: '#1d4ed8' },
] as const

const FURNITURE = [
  { x: 244, y: 62, w: 58, h: 26 },
  { x: 320, y: 62, w: 42, h: 26 },
  { x: 196, y: 160, w: 96, h: 40 },
  { x: 196, y: 214, w: 52, h: 26 },
  { x: 400, y: 156, w: 44, h: 34 },
  { x: 462, y: 156, w: 44, h: 34 },
  { x: 620, y: 150, w: 52, h: 30 },
  { x: 244, y: 330, w: 60, h: 28 },
  { x: 322, y: 330, w: 40, h: 28 },
  { x: 430, y: 300, w: 56, h: 30 },
  { x: 520, y: 330, w: 48, h: 28 },
]

export function MapPanel({ compact = false }: { compact?: boolean }) {
  return (
    <Panel className="min-h-0">
      <PanelHead
        icon={<Layers className="h-4 w-4" aria-hidden />}
        title="实验室地图（SLAM 建图与导航）"
        extra={
          <div className="hidden items-center gap-3 text-[11px] text-ink-muted sm:flex">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
              机器人位置
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-0.5 w-3.5 border-t-2 border-dashed border-brand-500" aria-hidden />
              规划路径
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              目标点
            </span>
          </div>
        }
      />

      <div className="relative min-h-0 flex-1 bg-slate-100/70 p-2.5">
        <svg
          viewBox="0 0 760 440"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full rounded-lg bg-white"
          role="img"
          aria-label="实验室地图占位图：包含起点、实验台A、实验台B、器材区、门口和充电区，以及到实验台A的规划路径"
        >
          <defs>
            <pattern id="map-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M16 0H0V16" fill="none" stroke="#e8eef5" strokeWidth="1" />
            </pattern>
            <filter id="robot-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="760" height="440" fill="url(#map-grid)" />

          <path
            d="M60 90 L660 74 L712 128 L700 330 L640 372 L120 386 L52 330 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {FURNITURE.map((item) => (
            <rect key={`${item.x}-${item.y}`} x={item.x} y={item.y} width={item.w} height={item.h} rx="3" fill="#e2e8f0" stroke="#cbd5e1" />
          ))}

          <polyline
            points="150,372 214,300 214,250 330,250 386,190 452,140 500,118"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeDasharray="7 5"
            strokeLinecap="round"
          />

          <g filter="url(#robot-glow)">
            <circle cx="386" cy="190" r="16" fill="#dbeafe" />
          </g>
          <circle cx="386" cy="190" r="7" fill="#2563eb" />
          <path d="M386 176 L381 165 L391 165 Z" fill="#1d4ed8" />

          {WAYPOINTS.map((point) => (
            <g key={point.id}>
              <circle cx={point.x} cy={point.y} r="7" fill="white" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx={point.x} cy={point.y} r="3" fill={point.dot} />
              <g transform={`translate(${point.x - 34} ${point.y - 34})`}>
                <rect width="68" height="22" rx="6" fill={point.fill} stroke={point.stroke} strokeWidth="1" />
                <text x="34" y="15" textAnchor="middle" fill={point.text} fontSize="12" fontWeight="600">
                  {point.label}
                </text>
              </g>
            </g>
          ))}
        </svg>

        <div className="absolute bottom-3 left-3 flex flex-col gap-1">
          {[
            { icon: Plus, label: '放大' },
            { icon: Minus, label: '缩小' },
            { icon: Crosshair, label: '回到机器人位置' },
          ].map((tool) => (
            <button
              key={tool.label}
              type="button"
              aria-label={tool.label}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-ink-soft shadow-sm transition-colors hover:border-brand-200 hover:text-brand-700"
            >
              <tool.icon className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
        </div>

        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <Badge tone="warning" dot>演示地图 · 未接 OccupancyGrid</Badge>
          {!compact ? (
            <span className="rounded bg-white/85 px-2 py-0.5 text-[11px] text-ink-muted shadow-sm">
              地图创建：2024-05-20 14:20
            </span>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
