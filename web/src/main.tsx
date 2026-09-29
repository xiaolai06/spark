import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { useAuthStore } from '@/store/auth'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('未找到 #root 挂载节点')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 启动后校验本地令牌，失效则回到登录页
void useAuthStore.getState().restore()
