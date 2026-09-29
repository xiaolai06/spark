/**
 * 类型定义：严格对应《Spark 轮足机器人实验平台_最终开发说明》第 7 节契约。
 * 字段命名与后端 JSON 保持一致（驼峰），null 表示暂无真实数据来源。
 */

export type DeviceState = 'online' | 'offline' | 'warning' | 'error' | 'unknown'
export type NavigationState = 'idle' | 'planning' | 'moving' | 'success' | 'failed' | 'cancelled'
export type TaskState = 'pending' | 'running' | 'paused' | 'success' | 'failed' | 'cancelled'
export type ChargingState = 'not_charging' | 'charging' | 'full' | 'unknown'

export interface NetworkInfo {
  ip: string | null
  latencyMs: number | null
  status: DeviceState
}

export interface SystemInfo {
  cpuUsage: number | null
  cpuTemperature: number | null
  memoryUsedGb: number | null
  memoryTotalGb: number | null
  memoryUsage: number | null
  diskUsedGb: number | null
  diskTotalGb: number | null
  diskUsage: number | null
  uptimeSeconds: number | null
}

/** 电池：底盘运行态确认前所有数值字段为 null */
export interface PowerInfo {
  percentage: number | null
  voltage: number | null
  current: number | null
  temperature: number | null
  chargingStatus: ChargingState
}

export interface MotionInfo {
  linearVelocity: number | null
  angularVelocity: number | null
}

export interface PoseInfo {
  x: number | null
  y: number | null
  yaw: number | null
}

export interface NavigationInfo {
  status: NavigationState
  target?: string | null
  distanceRemaining?: number | null
  goal?: { x: number; y: number; yaw: number } | null
}

export interface TaskInfo {
  id: string | null
  name: string | null
  status: TaskState
  progress: number | null
}

export interface RobotStatus {
  robotId: string
  name: string
  model: string
  online: boolean
  mode: string
  network: NetworkInfo
  system: SystemInfo
  power: PowerInfo
  motion: MotionInfo
  pose: PoseInfo
  sensors: Record<string, DeviceState>
  navigation: NavigationInfo
  task: TaskInfo
  emergencyStop: boolean
}

export interface RobotSummary {
  id: string
  name: string
  role?: string
  model: string
  ros: string
  ip: string | null
  online: boolean
}

export interface RobotCapabilities {
  base: boolean
  lidar: boolean
  map: boolean
  localization: boolean
  navigation: boolean
  rgbCamera: boolean
  depthCamera: boolean
  arm: boolean
  voice: boolean
  battery: boolean
}

export interface ConnectionTestResult {
  reachable: boolean
  rosbridge: boolean
  rosMaster: boolean
  latencyMs: number | null
  capabilities: Record<string, boolean>
  checkedAt: string
}

export interface MapMeta {
  frameId: string
  resolution: number
  width: number
  height: number
  origin: { x: number; y: number; yaw: number }
  data: number[] | null
  available: boolean
}

export interface Waypoint {
  id: string
  name: string
  code: string
  x: number
  y: number
  yaw: number
}

export interface VoiceRecord {
  id: string
  time: string
  text: string
  source: 'robot' | 'web'
  intent: string | null
  confidence: number | null
  status: 'parsed' | 'executing' | 'done' | 'rejected'
}

export interface PatrolTask {
  id: string
  name: string
  robotId: string
  status: TaskState
  progress: number | null
  currentStep: string | null
}

/* ---------------- 认证 ---------------- */
export interface AuthUser {
  id: string
  name: string
  email: string
  studentId: string
  phone: string
  department: string
  role: 'student' | 'teacher' | 'admin'
  createdAt: string
}

export interface AuthSession {
  token: string
  expiresIn: number
  tokenType: string
  user: AuthUser
}

/* ---------------- WebSocket 事件 ---------------- */
export type RobotEventType =
  | 'robot.status'
  | 'robot.pose'
  | 'robot.velocity'
  | 'power.status'
  | 'sensor.health'
  | 'navigation.status'
  | 'navigation.path'
  | 'task.status'
  | 'voice.transcript'
  | 'system.alert'

export interface RobotEvent<T = unknown> {
  type: RobotEventType
  robotId: string
  seq: number
  timestamp: string
  data: T
}
