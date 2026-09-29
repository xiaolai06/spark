/**
 * 内置演示数据。
 *
 * 仅在后端未启动或显式设置 VITE_USE_MOCK_API=true 时使用。
 * 约定：没有真实来源的字段保持 null（如电池），由展示层显示「--」。
 * 这些值不是实机数据，不能作为验收依据。
 */
import type { RobotStatus, VoiceRecord } from '@/api/types'

export type { VoiceRecord }

export interface ActivityEvent {
  id: string
  time: string
  level: 'info' | 'success' | 'warning' | 'danger'
  text: string
  source: 'navigation' | 'vision' | 'voice' | 'system' | 'patrol'
}

export const MOCK_STATUS: RobotStatus = {
  robotId: 'spark-01',
  name: 'Spark-01',
  model: 'NXROBO Spark',
  online: true,
  mode: '自主导航',
  network: { ip: '192.168.3.18', latencyMs: 22, status: 'online' },
  system: {
    cpuUsage: 32.0,
    cpuTemperature: 54.0,
    memoryUsedGb: 2.7,
    memoryTotalGb: 7.6,
    memoryUsage: 41.5,
    diskUsedGb: 48,
    diskTotalGb: 109,
    diskUsage: 46.0,
    uptimeSeconds: 10440,
  },
  power: {
    percentage: null,
    voltage: null,
    current: null,
    temperature: null,
    chargingStatus: 'unknown',
  },
  motion: { linearVelocity: 0.25, angularVelocity: 0.0 },
  pose: { x: 2.35, y: 1.82, yaw: 87.3 },
  sensors: {
    base: 'online',
    lidar: 'online',
    rgbCamera: 'online',
    depthCamera: 'online',
    imu: 'online',
    arm: 'unknown',
    voice: 'online',
  },
  navigation: { status: 'moving', target: '实验台 A', distanceRemaining: 2.48 },
  task: { id: 'task-001', name: '前往实验台 A', status: 'running', progress: 62 },
  emergencyStop: false,
}

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'a-1', time: '14:28:16', level: 'success', text: '语音识别成功：“去实验台 A”', source: 'voice' },
  { id: 'a-2', time: '14:28:14', level: 'info', text: '开始导航，规划路径已完成', source: 'navigation' },
  { id: 'a-3', time: '14:27:53', level: 'info', text: '到达目标点：起点', source: 'navigation' },
  { id: 'a-4', time: '14:27:28', level: 'warning', text: '视觉识别：红色工具箱（位置异常）', source: 'vision' },
  { id: 'a-5', time: '14:26:41', level: 'info', text: '机器人已就绪，等待指令', source: 'system' },
]

export const MOCK_VOICE: VoiceRecord[] = [
  { id: 'v-1', time: '14:28:16', text: '去实验台 A', source: 'robot', intent: '前往指定位置', confidence: 0.96, status: 'done' },
  { id: 'v-2', time: '14:25:03', text: '拍摄周围环境', source: 'robot', intent: '视觉拍摄', confidence: 0.91, status: 'done' },
  { id: 'v-3', time: '14:22:41', text: '检查实验台 B', source: 'robot', intent: '巡检检查', confidence: 0.89, status: 'done' },
]

/** 预设点位（与后端 /waypoints 初始数据一致，用于未接后端时展示） */
export const MOCK_WAYPOINTS = [
  { id: 'wp-start', name: '起点', code: 'start', x: 0.5, y: 0.8, yaw: 0 },
  { id: 'wp-lab-a', name: '实验台 A', code: 'lab-a', x: 2.35, y: 1.82, yaw: 1.57 },
  { id: 'wp-lab-b', name: '实验台 B', code: 'lab-b', x: 1.2, y: 1.65, yaw: 0 },
  { id: 'wp-equip', name: '器材区', code: 'equipment', x: 0.85, y: 1.1, yaw: 0 },
  { id: 'wp-door', name: '门口', code: 'door', x: 2.6, y: 0.9, yaw: 1.57 },
  { id: 'wp-charge', name: '充电区', code: 'charge', x: 2.5, y: 1.2, yaw: 3.14 },
]
