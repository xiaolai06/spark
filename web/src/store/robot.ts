/**
 * 机器人状态。
 *
 * 数据来源优先级：WebSocket 实时推送 > REST 拉取 > 内置演示数据。
 * 关键约定：没有真实来源的字段保持 null，展示层显示「--」；
 * 电池在底盘运行态确认前为 null；控制类操作不产生真实运动。
 */
import { create } from 'zustand'
import * as api from '@/api/robots'
import { subscribeRobotEvents, type SocketStatus } from '@/api/socket'
import { DEFAULT_ROBOT_ID, USE_MOCK_API } from '@/lib/config'
import type { ActivityEvent } from '@/mock/robotMock'
import { MOCK_ACTIVITY, MOCK_STATUS, MOCK_VOICE } from '@/mock/robotMock'
import type {
  DeviceState,
  MotionInfo,
  NavigationInfo,
  PoseInfo,
  PowerInfo,
  RobotEvent,
  RobotStatus,
  TaskInfo,
  VoiceRecord,
} from '@/api/types'

/** 活动流与语音记录属于展示型数据，接真机前用内置演示数据 */
export type { ActivityEvent, VoiceRecord }

interface RobotState {
  status: RobotStatus
  activity: ActivityEvent[]
  voiceRecords: VoiceRecord[]
  /** 'live' 已连后端；'mock' 使用内置演示数据 */
  source: 'live' | 'mock'
  socketStatus: SocketStatus
  loading: boolean
  error: string | null
  lastUpdated: string | null
  init: () => () => void
  refresh: () => Promise<void>
  loadVoiceRecords: () => Promise<void>
  setPendingAction: (label: string | null) => void
  pendingAction: string | null
}

export const useRobotStore = create<RobotState>((set, get) => ({
  status: MOCK_STATUS,
  activity: MOCK_ACTIVITY,
  voiceRecords: MOCK_VOICE,
  source: USE_MOCK_API ? 'mock' : 'live',
  socketStatus: 'closed',
  loading: false,
  error: null,
  lastUpdated: null,
  pendingAction: null,

  setPendingAction: (label) => set({ pendingAction: label }),

  init: () => {
    void get().refresh()
    void get().loadVoiceRecords()

    if (USE_MOCK_API) return () => {}

    return subscribeRobotEvents({
      robotId: DEFAULT_ROBOT_ID,
      onStatus: (socketStatus) => set({ socketStatus }),
      onEvent: (event) => set((state) => applyRobotEvent(state, event)),
    })
  },

  refresh: async () => {
    if (USE_MOCK_API) {
      set({ status: MOCK_STATUS, source: 'mock' })
      return
    }
    set({ loading: true, error: null })
    try {
      const status = await api.getRobotStatus(DEFAULT_ROBOT_ID)
      set({ status, source: 'live', loading: false, lastUpdated: new Date().toISOString() })
    } catch (error) {
      // 后端不可用时回退到演示数据，但明确标记来源，前端会显示「演示数据」
      set({
        status: MOCK_STATUS,
        source: 'mock',
        loading: false,
        error: error instanceof Error ? error.message : '获取机器人状态失败',
      })
    }
  },

  loadVoiceRecords: async () => {
    if (USE_MOCK_API) return
    try {
      const records = await api.listVoiceRecords(DEFAULT_ROBOT_ID)
      if (records.length > 0) set({ voiceRecords: records })
    } catch {
      // 语音记录获取失败时保留演示数据，不影响主流程
    }
  },
}))

export const selectStatus = (state: RobotState) => state.status

/**
 * 按契约合并实时事件。
 *
 * robot.status 是全量快照，直接覆盖；其余事件是增量，
 * 只更新对应字段，避免用局部数据覆盖掉完整状态。
 */
function applyRobotEvent(state: RobotState, event: RobotEvent): Partial<RobotState> {
  const live = { source: 'live' as const, lastUpdated: event.timestamp }
  const status = state.status

  switch (event.type) {
    case 'robot.status':
      return { ...live, status: event.data as RobotStatus }

    case 'robot.pose': {
      const pose = event.data as PoseInfo
      return { ...live, status: { ...status, pose } }
    }

    case 'robot.velocity': {
      const motion = event.data as MotionInfo
      return { ...live, status: { ...status, motion } }
    }

    case 'power.status': {
      const power = event.data as PowerInfo
      return { ...live, status: { ...status, power } }
    }

    case 'sensor.health': {
      const sensors = event.data as Record<string, DeviceState>
      return { ...live, status: { ...status, sensors: { ...status.sensors, ...sensors } } }
    }

    case 'navigation.status': {
      const navigation = event.data as NavigationInfo
      return { ...live, status: { ...status, navigation } }
    }

    case 'task.status': {
      const task = event.data as TaskInfo
      return { ...live, status: { ...status, task } }
    }

    case 'voice.transcript': {
      const record = event.data as VoiceRecord
      // 同一 eventId 只保留一条，避免重连补发造成重复记录
      const rest = state.voiceRecords.filter((item) => item.id !== record.id)
      return { ...live, voiceRecords: [record, ...rest] }
    }

    // navigation.path / system.alert 暂不驱动状态，保留事件到达即可
    default:
      return live
  }
}
