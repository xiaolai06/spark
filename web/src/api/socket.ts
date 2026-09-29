/**
 * WebSocket 连接管理：对应契约 /ws/v1/robots/{robotId}。
 *
 * 断线后按退避间隔自动重连；重连只补齐状态，不会重放任何历史命令。
 */
import { getToken } from './client'
import { WS_BASE_URL } from '@/lib/config'
import type { RobotEvent, RobotEventType } from './types'

export type SocketStatus = 'connecting' | 'open' | 'closed'

interface SubscribeOptions {
  robotId: string
  onEvent: (event: RobotEvent) => void
  onStatus?: (status: SocketStatus) => void
}

const MAX_BACKOFF_MS = 15_000

export function subscribeRobotEvents({ robotId, onEvent, onStatus }: SubscribeOptions) {
  let socket: WebSocket | null = null
  let retry = 0
  let timer: number | null = null
  let stopped = false

  const connect = () => {
    if (stopped) return
    onStatus?.('connecting')
    // 浏览器 WebSocket 握手无法自定义 Authorization 头，令牌通过查询参数传递
    const token = getToken()
    const url = `${WS_BASE_URL}/robots/${encodeURIComponent(robotId)}${token ? `?token=${encodeURIComponent(token)}` : ''}`
    try {
      socket = new WebSocket(url)
    } catch {
      scheduleReconnect()
      return
    }

    socket.onopen = () => {
      retry = 0
      onStatus?.('open')
    }

    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data as string) as RobotEvent
        if (event && typeof event.type === 'string') onEvent(event)
      } catch {
        // 忽略无法解析的单条消息，不断开连接
      }
    }

    socket.onclose = () => {
      onStatus?.('closed')
      scheduleReconnect()
    }

    socket.onerror = () => {
      socket?.close()
    }
  }

  const scheduleReconnect = () => {
    if (stopped) return
    retry += 1
    const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** (retry - 1))
    timer = window.setTimeout(connect, delay)
  }

  connect()

  return () => {
    stopped = true
    if (timer !== null) window.clearTimeout(timer)
    socket?.close()
    onStatus?.('closed')
  }
}

export function isStatusEvent(type: RobotEventType): boolean {
  return type === 'robot.status'
}
