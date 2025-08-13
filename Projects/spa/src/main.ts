import { createApp } from 'vue'
import './styles/theme.css'
import './styles/minimal-interactions.css'
import App from './App.vue'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err, info)
}

// Global warning handler
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Global warning:', msg, trace)
}

// Performance monitoring
if (import.meta.env.DEV) {
  app.config.performance = true
}

app.mount('#app')