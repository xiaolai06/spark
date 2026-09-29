/**
 * 机器人相关接口：对应最终说明 7.2 的 /api/v1/robots/* 与 /api/v1/patrol/*。
 * 控制类接口在安全门禁通过前只会返回"已受理"或明确错误码。
 */
import { http } from './client'
import type {
  ConnectionTestResult,
  MapMeta,
  PatrolTask,
  RobotCapabilities,
  RobotStatus,
  RobotSummary,
  VoiceRecord,
  Waypoint,
} from './types'

/* ---------------- 机器人 ---------------- */
export const listRobots = () => http.get<RobotSummary[]>('/robots')

export const getRobot = (robotId: string) => http.get<RobotSummary>(`/robots/${robotId}`)

export const getRobotStatus = (robotId: string) => http.get<RobotStatus>(`/robots/${robotId}/status`)

export const getCapabilities = (robotId: string) =>
  http.get<RobotCapabilities>(`/robots/${robotId}/capabilities`)

export const testConnection = (robotId: string) =>
  http.post<ConnectionTestResult>(`/robots/${robotId}/connection/test`)

/* ---------------- 地图与点位 ---------------- */
export const getMap = (robotId: string) => http.get<MapMeta>(`/robots/${robotId}/map`)

export const listWaypoints = (robotId: string) => http.get<Waypoint[]>(`/robots/${robotId}/waypoints`)

export const createWaypoint = (
  robotId: string,
  payload: Pick<Waypoint, 'name' | 'x' | 'y' | 'yaw'> & { code?: string },
) => http.post<Waypoint>(`/robots/${robotId}/waypoints`, payload)

export const updateWaypoint = (
  robotId: string,
  waypointId: string,
  payload: Partial<Pick<Waypoint, 'name' | 'x' | 'y' | 'yaw'>>,
) => http.patch<Waypoint>(`/robots/${robotId}/waypoints/${waypointId}`, payload)

export const deleteWaypoint = (robotId: string, waypointId: string) =>
  http.delete<void>(`/robots/${robotId}/waypoints/${waypointId}`)

/* ---------------- 导航 ---------------- */
export const createGoal = (
  robotId: string,
  payload: { x: number; y: number; yaw: number; waypointId?: string | null },
) => http.post<{ goalId: string; status: string }>(`/robots/${robotId}/navigation/goals`, payload)

export const getNavigation = (robotId: string) =>
  http.get<{
    status: string
    goal: { x: number; y: number; yaw: number } | null
    distanceRemaining: number | null
  }>(`/robots/${robotId}/navigation`)

export const cancelNavigation = (robotId: string) =>
  http.delete<{ status: string }>(`/robots/${robotId}/navigation/goals/current`)

/* ---------------- 控制权与急停 ---------------- */
export const acquireControlLease = (robotId: string) =>
  http.post<{ leaseId: string; expiresIn: number }>(`/robots/${robotId}/control/lease`)

export const triggerEmergencyStop = (robotId: string) =>
  http.post<{ emergencyStop: boolean; message: string }>(`/robots/${robotId}/emergency-stop`)

export const resetEmergencyStop = (robotId: string) =>
  http.post<{ emergencyStop: boolean; message: string }>(`/robots/${robotId}/emergency-stop/reset`)

/* ---------------- 语音与巡检 ---------------- */
export const listVoiceRecords = (robotId: string) =>
  http.get<VoiceRecord[]>(`/robots/${robotId}/voice/records`)

export const listPatrolTasks = () => http.get<PatrolTask[]>('/patrol/tasks')
