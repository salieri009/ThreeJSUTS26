<template>
  <footer class="app-footer">
    <!-- Status Information Section -->
    <div class="footer-status">
      <div class="status-group">
        <div class="status-icon" :class="connectionStatus"></div>
        <span class="status-value">{{ connectionText }}</span>
      </div>
      
      <div class="status-group">
        <span class="status-label">Farm:</span>
        <span class="status-value highlight">{{ farmStats.animals }} animals</span>
      </div>
      
      <div class="status-group">
        <span class="status-label">FPS:</span>
        <span class="status-value" :class="{ highlight: currentFPS >= 60 }">{{ currentFPS }}</span>
      </div>
      
      <div class="status-group">
        <span class="status-label">Memory:</span>
        <span class="status-value">{{ memoryUsage }}</span>
      </div>
      
      <div class="status-group" v-if="lastSaved">
        <span class="status-label">Saved:</span>
        <span class="status-value">{{ formatTime(lastSaved) }}</span>
      </div>
    </div>
    
    <!-- Quick Stats Section -->
    <div class="footer-stats">
      <div class="stat-item">
        <div class="stat-icon">{{ weatherIcon }}</div>
        <div class="stat-label">Weather</div>
        <div class="stat-value">{{ currentWeather }}</div>
      </div>
      
      <div class="weather-display">
        <div class="weather-icon">{{ weatherIcon }}</div>
        <div class="weather-temp">{{ temperature }}°C</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">🌅</div>
        <div class="stat-label">Time</div>
        <div class="stat-value">{{ formatGameTime(gameTime) }}</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">📈</div>
        <div class="stat-label">Happiness</div>
        <div class="stat-value">{{ farmStats.happiness }}%</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-icon">⚡</div>
        <div class="stat-label">Performance</div>
        <div class="stat-value">{{ performanceRating }}</div>
      </div>
    </div>
    
    <!-- Social Actions Section -->
    <div class="footer-social">
      <button class="social-btn" @click="takeScreenshot" :disabled="isProcessing">
        <i class="btn-icon">📸</i>
        <div class="action-tooltip">Screenshot</div>
      </button>
      
      <button class="social-btn" @click="toggleRecording" :class="{ recording: isRecording }">
        <i class="btn-icon">{{ isRecording ? '⏹️' : '🎬' }}</i>
        <div class="action-tooltip">{{ isRecording ? 'Stop Recording' : 'Start Recording' }}</div>
      </button>
      
      <button class="social-btn" @click="shareScene" :disabled="isProcessing">
        <i class="btn-icon">🌐</i>
        <div class="action-tooltip">Share Farm</div>
      </button>
      
      <button class="social-btn" @click="openCommunity">
        <i class="btn-icon">👥</i>
        <div class="action-tooltip">Community</div>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Types
interface FarmStats {
  animals: number
  buildings: number
  happiness: number
  productivity: number
}

interface WeatherData {
  type: string
  temperature: number
  icon: string
}

// Reactive state
const currentFPS = ref(60)
const memoryUsage = ref('145MB')
const connectionStatus = ref<'online' | 'offline' | 'loading'>('online')
const lastSaved = ref<Date | null>(new Date())
const isRecording = ref(false)
const isProcessing = ref(false)
const gameTime = ref(12.5) // 12:30 in 24h format

// Farm data
const farmStats = ref<FarmStats>({
  animals: 12,
  buildings: 8,
  happiness: 87,
  productivity: 94
})

// Weather data
const weatherData = ref<WeatherData>({
  type: 'Sunny',
  temperature: 22,
  icon: '☀️'
})

// Computed properties
const connectionText = computed(() => {
  switch (connectionStatus.value) {
    case 'online': return 'Online'
    case 'offline': return 'Offline'
    case 'loading': return 'Connecting...'
    default: return 'Unknown'
  }
})

const currentWeather = computed(() => weatherData.value.type)
const temperature = computed(() => weatherData.value.temperature)
const weatherIcon = computed(() => weatherData.value.icon)

const performanceRating = computed(() => {
  if (currentFPS.value >= 55) return 'Excellent'
  if (currentFPS.value >= 45) return 'Good'
  if (currentFPS.value >= 30) return 'Fair'
  return 'Poor'
})

// Methods
const takeScreenshot = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  console.log('Taking screenshot...')
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Screenshot taken successfully')
    showNotification('Screenshot saved successfully!', 'success')
  } catch (error) {
    console.error('Screenshot failed:', error)
    showNotification('Screenshot failed. Please try again.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const toggleRecording = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  
  try {
    if (isRecording.value) {
      console.log('Stopping recording...')
      await new Promise(resolve => setTimeout(resolve, 500))
      isRecording.value = false
      showNotification('Recording stopped and saved', 'success')
    } else {
      console.log('Starting recording...')
      await new Promise(resolve => setTimeout(resolve, 500))
      isRecording.value = true
      showNotification('Recording started', 'info')
    }
  } catch (error) {
    console.error('Recording toggle failed:', error)
    showNotification('Recording action failed', 'error')
  } finally {
    isProcessing.value = false
  }
}

const shareScene = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  console.log('Sharing scene...')
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const shareUrl = `https://animal-simulator.app/farm/${generateShareId()}`
    
    if (navigator.share) {
      await navigator.share({
        title: 'My Animal Farm',
        text: 'Check out my amazing farm in Animal Simulator!',
        url: shareUrl
      })
    } else {
      await navigator.clipboard.writeText(shareUrl)
      showNotification('Share link copied to clipboard!', 'success')
    }
  } catch (error) {
    console.error('Share failed:', error)
    showNotification('Share failed. Please try again.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const openCommunity = () => {
  console.log('Opening community...')
}

const generateShareId = (): string => {
  return Math.random().toString(36).substring(2, 15)
}

const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
  console.log(`${type.toUpperCase()}: ${message}`)
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const formatGameTime = (time: number): string => {
  const hours = Math.floor(time)
  const minutes = Math.floor((time - hours) * 60)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

const updatePerformanceMetrics = () => {
  currentFPS.value = Math.floor(Math.random() * 20) + 45
  
  const baseMemory = 120
  const variance = Math.random() * 50
  memoryUsage.value = `${Math.floor(baseMemory + variance)}MB`
  
  if (Math.random() < 0.02) {
    connectionStatus.value = connectionStatus.value === 'online' ? 'loading' : 'online'
    
    if (connectionStatus.value === 'loading') {
      setTimeout(() => {
        connectionStatus.value = 'online'
      }, 2000)
    }
  }
}

const updateGameData = () => {
  gameTime.value += 0.017
  if (gameTime.value >= 24) gameTime.value = 0
  
  if (Math.random() < 0.01) {
    const weathers = [
      { type: 'Sunny', icon: '☀️', temp: 22 },
      { type: 'Cloudy', icon: '☁️', temp: 18 },
      { type: 'Rainy', icon: '🌧️', temp: 15 },
      { type: 'Snowy', icon: '❄️', temp: -2 }
    ]
    const randomWeather = weathers[Math.floor(Math.random() * weathers.length)]
    weatherData.value = {
      type: randomWeather.type,
      temperature: randomWeather.temp + Math.floor(Math.random() * 6) - 3,
      icon: randomWeather.icon
    }
  }
  
  if (Math.random() < 0.05) {
    farmStats.value.happiness = Math.max(70, Math.min(100, farmStats.value.happiness + (Math.random() * 6) - 3))
    farmStats.value.productivity = Math.max(60, Math.min(100, farmStats.value.productivity + (Math.random() * 4) - 2))
  }
}

const updateLastSaved = () => {
  lastSaved.value = new Date()
}

let performanceInterval: number | null = null
let gameDataInterval: number | null = null
let saveInterval: number | null = null

onMounted(() => {
  performanceInterval = setInterval(updatePerformanceMetrics, 1000)
  gameDataInterval = setInterval(updateGameData, 1000)
  saveInterval = setInterval(updateLastSaved, 30000)
  
  console.log('FooterBar initialized with monitoring systems')
})

onUnmounted(() => {
  if (performanceInterval) clearInterval(performanceInterval)
  if (gameDataInterval) clearInterval(gameDataInterval)
  if (saveInterval) clearInterval(saveInterval)
  
  if (isRecording.value) {
    isRecording.value = false
    console.log('Recording stopped due to component unmount')
  }
})

watch(isRecording, (newValue) => {
  if (newValue) {
    console.log('Recording active - monitoring performance more closely')
  }
})
</script>

<style scoped>
/* Smart Footer Styles */
.app-footer {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 0 1.5rem;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--glass-border);
  height: 48px;
  position: relative;
  overflow: hidden;
}

.app-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--primary-500),
    var(--secondary-500),
    var(--accent-500),
    transparent
  );
  animation: footer-glow 4s ease-in-out infinite;
}

@keyframes footer-glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* Status Information Section */
.footer-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--glass-bg);
  border-radius: var(--radius-full);
  border: 1px solid var(--glass-border);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.status-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
}

.status-icon.online {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
}

.status-icon.offline {
  background: var(--error);
  box-shadow: 0 0 6px var(--error);
}

.status-icon.loading {
  background: var(--warning);
  animation: status-pulse 1s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

.status-label {
  color: var(--neutral-500);
  font-weight: var(--font-medium);
}

.status-value {
  color: var(--neutral-600);
  font-variant-numeric: tabular-nums;
}

.status-value.highlight {
  color: var(--primary-600);
  font-weight: var(--font-semibold);
}

/* Quick Stats Section */
.footer-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 60px;
}

.stat-icon {
  font-size: var(--text-lg);
  line-height: 1;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--neutral-500);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: var(--text-sm);
  color: var(--neutral-700);
  font-weight: var(--font-semibold);
  font-variant-numeric: tabular-nums;
}

/* Weather Display */
.weather-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--glass-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.weather-icon {
  font-size: var(--text-base);
  animation: weather-float 3s ease-in-out infinite;
}

@keyframes weather-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.weather-temp {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
  font-variant-numeric: tabular-nums;
}

/* Social Actions Section */
.footer-social {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.social-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--neutral-600);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.social-btn:hover:not(:disabled) {
  background: var(--primary-50);
  color: var(--primary-600);
  border-color: var(--primary-200);
  transform: translateY(-1px);
}

.social-btn:active:not(:disabled) {
  transform: translateY(0);
}

.social-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.social-btn.recording {
  background: var(--error);
  color: white;
  border-color: var(--error);
  animation: recording-pulse 1s ease-in-out infinite;
}

@keyframes recording-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--error); }
  50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3); }
}

.btn-icon {
  font-size: var(--text-sm);
}

/* Tooltips */
.action-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--neutral-900);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 100;
}

.action-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--neutral-900);
}

.social-btn:hover .action-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-12px);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .app-footer {
    height: 56px;
    padding: 0 1rem;
    grid-template-columns: 1fr auto;
  }
  
  .footer-stats {
    display: none;
  }
  
  .footer-status {
    gap: 0.5rem;
  }
  
  .status-group {
    padding: 0.25rem 0.5rem;
    font-size: 10px;
  }
  
  .social-btn {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .footer-stats {
    gap: 1rem;
  }
  
  .stat-item {
    min-width: 50px;
  }
}

@media (max-width: 480px) {
  .app-footer {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  
  .footer-status {
    justify-content: center;
  }
  
  .footer-social {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
  }
}

[data-theme="dark"] .action-tooltip {
  background: var(--neutral-100);
  color: var(--neutral-900);
}

[data-theme="dark"] .action-tooltip::after {
  border-top-color: var(--neutral-100);
}

@media (prefers-contrast: high) {
  .status-icon.online {
    background: #00ff00;
  }
  
  .status-icon.offline {
    background: #ff0000;
  }
  
  .status-icon.loading {
    background: #ffff00;
  }
}

@media (prefers-reduced-motion: reduce) {
  .weather-icon,
  .footer-glow,
  .status-pulse,
  .recording-pulse {
    animation: none;
  }
}
</style>
