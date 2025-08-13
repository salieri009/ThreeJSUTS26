<template>
  <aside class="right-dock" :class="{ collapsed: isCollapsed, expanded: isExpanded }">
    <!-- Dock Header -->
    <div class="dock-header">
      <div class="dock-title" v-if="!isCollapsed">
        <i class="title-icon">🎚️</i>
        Environment Controls
      </div>
      <button class="dock-toggle-btn" @click="toggleDock" :title="isCollapsed ? 'Expand Controls' : 'Collapse Controls'">
        <i class="toggle-icon">{{ isCollapsed ? '◀️' : '▶️' }}</i>
      </button>
    </div>

    <!-- Control Sections -->
    <div class="control-sections" v-if="!isCollapsed">
      
      <!-- Weather Control Section -->
      <div class="control-section weather-section">
        <div class="section-header" @click="toggleSection('weather')">
          <div class="section-info">
            <i class="section-icon">🌦️</i>
            <span class="section-title">Weather</span>
          </div>
          <button class="section-toggle" :class="{ active: expandedSections.weather }">
            <i>{{ expandedSections.weather ? '▼' : '▶' }}</i>
          </button>
        </div>
        
        <div class="section-content" v-if="expandedSections.weather">
          <!-- Current Weather Display -->
          <div class="weather-current">
            <div class="weather-icon">{{ currentWeather.icon }}</div>
            <div class="weather-info">
              <div class="weather-type">{{ currentWeather.type }}</div>
              <div class="weather-temp">{{ currentWeather.temperature }}°C</div>
            </div>
            <div class="weather-intensity">
              <span class="intensity-label">Intensity</span>
              <div class="intensity-bar">
                <div class="intensity-fill" :style="{ width: currentWeather.intensity + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- Weather Options -->
          <div class="weather-options">
            <button
              v-for="weather in weatherOptions"
              :key="weather.type"
              class="weather-option"
              :class="{ active: currentWeather.type === weather.type }"
              @click="setWeather(weather)"
              :title="weather.description"
            >
              <div class="weather-option-icon">{{ weather.icon }}</div>
              <div class="weather-option-label">{{ weather.type }}</div>
            </button>
          </div>

          <!-- Weather Intensity Slider -->
          <div class="weather-controls">
            <label class="control-label">Intensity</label>
            <input
              type="range"
              min="0"
              max="100"
              v-model="currentWeather.intensity"
              class="weather-slider"
              @input="updateWeatherIntensity"
            />
            <span class="control-value">{{ currentWeather.intensity }}%</span>
          </div>
        </div>
      </div>

      <!-- Time Control Section -->
      <div class="control-section time-section">
        <div class="section-header" @click="toggleSection('time')">
          <div class="section-info">
            <i class="section-icon">🌅</i>
            <span class="section-title">Time & Day Cycle</span>
          </div>
          <button class="section-toggle" :class="{ active: expandedSections.time }">
            <i>{{ expandedSections.time ? '▼' : '▶' }}</i>
          </button>
        </div>
        
        <div class="section-content" v-if="expandedSections.time">
          <!-- Time Display -->
          <div class="time-display">
            <div class="time-current">{{ formatTime(currentTime) }}</div>
            <div class="time-period">{{ getTimePeriod(currentTime) }}</div>
            <div class="time-speed">{{ timeSpeed }}x speed</div>
          </div>

          <!-- Time Slider -->
          <div class="time-slider-container">
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              v-model="currentTime"
              class="time-slider"
              @input="updateTime"
            />
            <div class="time-markers">
              <span class="time-marker" v-for="hour in timeMarkers" :key="hour" :style="{ left: (hour / 24) * 100 + '%' }">
                {{ hour }}
              </span>
            </div>
          </div>

          <!-- Time Controls -->
          <div class="time-controls">
            <button class="time-control-btn" @click="pauseTime" :class="{ active: isPaused }">
              <i>{{ isPaused ? '▶️' : '⏸️' }}</i>
              {{ isPaused ? 'Play' : 'Pause' }}
            </button>
            
            <div class="speed-controls">
              <label class="control-label">Speed</label>
              <div class="speed-buttons">
                <button
                  v-for="speed in speedOptions"
                  :key="speed"
                  class="speed-btn"
                  :class="{ active: timeSpeed === speed }"
                  @click="setTimeSpeed(speed)"
                >
                  {{ speed }}x
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Season Control Section -->
      <div class="control-section season-section">
        <div class="section-header" @click="toggleSection('season')">
          <div class="section-info">
            <i class="section-icon">🍂</i>
            <span class="section-title">Seasons</span>
          </div>
          <button class="section-toggle" :class="{ active: expandedSections.season }">
            <i>{{ expandedSections.season ? '▼' : '▶' }}</i>
          </button>
        </div>
        
        <div class="section-content" v-if="expandedSections.season">
          <!-- Current Season -->
          <div class="season-current">
            <div class="season-icon">{{ currentSeason.icon }}</div>
            <div class="season-info">
              <div class="season-name">{{ currentSeason.name }}</div>
              <div class="season-progress">Day {{ seasonProgress }} of {{ seasonDuration }}</div>
            </div>
          </div>

          <!-- Season Options -->
          <div class="season-options">
            <button
              v-for="season in seasonOptions"
              :key="season.name"
              class="season-option"
              :class="{ active: currentSeason.name === season.name }"
              @click="setSeason(season)"
            >
              <div class="season-option-icon">{{ season.icon }}</div>
              <div class="season-option-name">{{ season.name }}</div>
            </button>
          </div>

          <!-- Season Settings -->
          <div class="season-settings">
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" v-model="autoSeasonChange" @change="toggleAutoSeason" />
                Auto Season Change
              </label>
            </div>
            
            <div class="setting-item" v-if="autoSeasonChange">
              <label class="control-label">Season Duration (days)</label>
              <input
                type="range"
                min="7"
                max="60"
                v-model="seasonDuration"
                class="duration-slider"
              />
              <span class="control-value">{{ seasonDuration }} days</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphics Settings Section -->
      <div class="control-section graphics-section">
        <div class="section-header" @click="toggleSection('graphics')">
          <div class="section-info">
            <i class="section-icon">🎨</i>
            <span class="section-title">Graphics</span>
          </div>
          <button class="section-toggle" :class="{ active: expandedSections.graphics }">
            <i>{{ expandedSections.graphics ? '▼' : '▶' }}</i>
          </button>
        </div>
        
        <div class="section-content" v-if="expandedSections.graphics">
          <!-- Quality Preset -->
          <div class="graphics-preset">
            <label class="control-label">Quality Preset</label>
            <select v-model="graphicsSettings.quality" @change="applyGraphicsPreset" class="quality-select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <!-- Individual Settings -->
          <div class="graphics-settings">
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" v-model="graphicsSettings.shadows" @change="updateGraphics" />
                Shadows
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" v-model="graphicsSettings.particles" @change="updateGraphics" />
                Particle Effects
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" v-model="graphicsSettings.antialiasing" @change="updateGraphics" />
                Anti-aliasing
              </label>
            </div>

            <div class="setting-item">
              <label class="control-label">Render Distance</label>
              <input
                type="range"
                min="50"
                max="200"
                v-model="graphicsSettings.renderDistance"
                @input="updateGraphics"
                class="setting-slider"
              />
              <span class="control-value">{{ graphicsSettings.renderDistance }}%</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Quick Actions (Always Visible) -->
    <div class="quick-actions">
      <button class="quick-action-btn" @click="saveScene" :disabled="isSaving" title="Save Scene">
        <i class="action-icon">{{ isSaving ? '⏳' : '💾' }}</i>
        <span class="action-label" v-if="!isCollapsed">Save</span>
      </button>
      
      <button class="quick-action-btn" @click="loadScene" title="Load Scene">
        <i class="action-icon">📂</i>
        <span class="action-label" v-if="!isCollapsed">Load</span>
      </button>
      
      <button class="quick-action-btn" @click="resetScene" title="Reset Scene">
        <i class="action-icon">🔄</i>
        <span class="action-label" v-if="!isCollapsed">Reset</span>
      </button>
      
      <button class="quick-action-btn" @click="toggleFullscreen" title="Toggle Fullscreen">
        <i class="action-icon">{{ isFullscreen ? '🪟' : '📺' }}</i>
        <span class="action-label" v-if="!isCollapsed">{{ isFullscreen ? 'Window' : 'Fullscreen' }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Types
interface WeatherOption {
  type: string
  icon: string
  temperature: number
  description: string
}

interface Season {
  name: string
  icon: string
  effects: string[]
}

interface GraphicsSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra' | 'custom'
  shadows: boolean
  particles: boolean
  antialiasing: boolean
  renderDistance: number
}

// Reactive state
const isCollapsed = ref(false)
const isExpanded = ref(false)
const isSaving = ref(false)
const isFullscreen = ref(false)
const isPaused = ref(false)
const autoSeasonChange = ref(true)

// Expanded sections
const expandedSections = ref({
  weather: true,
  time: false,
  season: false,
  graphics: false
})

// Weather system
const currentWeather = ref({
  type: 'Sunny',
  icon: '☀️',
  temperature: 22,
  intensity: 75
})

const weatherOptions = ref<WeatherOption[]>([
  { type: 'Sunny', icon: '☀️', temperature: 25, description: 'Clear sunny day' },
  { type: 'Cloudy', icon: '☁️', temperature: 20, description: 'Overcast skies' },
  { type: 'Rainy', icon: '🌧️', temperature: 15, description: 'Light to moderate rain' },
  { type: 'Stormy', icon: '⛈️', temperature: 12, description: 'Thunderstorms' },
  { type: 'Snowy', icon: '❄️', temperature: -2, description: 'Snowfall' },
  { type: 'Foggy', icon: '🌫️', temperature: 18, description: 'Dense fog' }
])

// Time system
const currentTime = ref(12.5) // 12:30
const timeSpeed = ref(1)
const speedOptions = [0.1, 0.5, 1, 2, 5, 10]
const timeMarkers = [6, 12, 18, 24]

// Season system
const currentSeason = ref({
  name: 'Spring',
  icon: '🌸'
})

const seasonOptions = ref<Season[]>([
  { name: 'Spring', icon: '🌸', effects: ['cherry blossoms', 'growth boost'] },
  { name: 'Summer', icon: '☀️', effects: ['heat waves', 'fireflies'] },
  { name: 'Autumn', icon: '🍂', effects: ['falling leaves', 'harvest time'] },
  { name: 'Winter', icon: '❄️', effects: ['snow', 'slower growth'] }
])

const seasonProgress = ref(15)
const seasonDuration = ref(30)

// Graphics system
const graphicsSettings = ref<GraphicsSettings>({
  quality: 'high',
  shadows: true,
  particles: true,
  antialiasing: true,
  renderDistance: 100
})

// Methods
const toggleDock = () => {
  isCollapsed.value = !isCollapsed.value
  if (isCollapsed.value) {
    isExpanded.value = false
  }
}

const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

const setWeather = (weather: WeatherOption) => {
  currentWeather.value = {
    type: weather.type,
    icon: weather.icon,
    temperature: weather.temperature,
    intensity: currentWeather.value.intensity
  }
  console.log('Weather changed to:', weather.type)
  // Emit to parent component
  emitWeatherChange()
}

const updateWeatherIntensity = () => {
  console.log('Weather intensity:', currentWeather.value.intensity)
  emitWeatherChange()
}

const emitWeatherChange = () => {
  // This would emit to parent component or global state
  console.log('Emitting weather change:', currentWeather.value)
}

const formatTime = (time: number): string => {
  const hours = Math.floor(time)
  const minutes = Math.floor((time - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const getTimePeriod = (time: number): string => {
  if (time >= 5 && time < 12) return 'Morning'
  if (time >= 12 && time < 17) return 'Afternoon'
  if (time >= 17 && time < 21) return 'Evening'
  return 'Night'
}

const updateTime = () => {
  console.log('Time changed to:', formatTime(currentTime.value))
  // Emit to parent component
}

const pauseTime = () => {
  isPaused.value = !isPaused.value
  console.log('Time paused:', isPaused.value)
}

const setTimeSpeed = (speed: number) => {
  timeSpeed.value = speed
  console.log('Time speed changed to:', speed)
}

const setSeason = (season: Season) => {
  currentSeason.value = season
  seasonProgress.value = 1 // Reset progress
  console.log('Season changed to:', season.name)
}

const toggleAutoSeason = () => {
  console.log('Auto season change:', autoSeasonChange.value)
}

const applyGraphicsPreset = () => {
  const presets = {
    low: { shadows: false, particles: false, antialiasing: false, renderDistance: 50 },
    medium: { shadows: true, particles: false, antialiasing: false, renderDistance: 75 },
    high: { shadows: true, particles: true, antialiasing: false, renderDistance: 100 },
    ultra: { shadows: true, particles: true, antialiasing: true, renderDistance: 150 }
  }
  
  if (graphicsSettings.value.quality !== 'custom') {
    const preset = presets[graphicsSettings.value.quality]
    if (preset) {
      Object.assign(graphicsSettings.value, preset)
      updateGraphics()
    }
  }
}

const updateGraphics = () => {
  // Check if settings match a preset
  const presets = {
    low: { shadows: false, particles: false, antialiasing: false, renderDistance: 50 },
    medium: { shadows: true, particles: false, antialiasing: false, renderDistance: 75 },
    high: { shadows: true, particles: true, antialiasing: false, renderDistance: 100 },
    ultra: { shadows: true, particles: true, antialiasing: true, renderDistance: 150 }
  }
  
  let matchesPreset = false
  for (const [preset, settings] of Object.entries(presets)) {
    if (
      graphicsSettings.value.shadows === settings.shadows &&
      graphicsSettings.value.particles === settings.particles &&
      graphicsSettings.value.antialiasing === settings.antialiasing &&
      Math.abs(graphicsSettings.value.renderDistance - settings.renderDistance) <= 5
    ) {
      graphicsSettings.value.quality = preset as any
      matchesPreset = true
      break
    }
  }
  
  if (!matchesPreset) {
    graphicsSettings.value.quality = 'custom'
  }
  
  console.log('Graphics settings updated:', graphicsSettings.value)
}

const saveScene = async () => {
  isSaving.value = true
  console.log('Saving scene...')
  
  try {
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Scene saved successfully')
    showNotification('Scene saved successfully!', 'success')
  } catch (error) {
    console.error('Save failed:', error)
    showNotification('Save failed. Please try again.', 'error')
  } finally {
    isSaving.value = false
  }
}

const loadScene = () => {
  console.log('Loading scene...')
  showNotification('Load scene functionality coming soon!', 'info')
}

const resetScene = () => {
  if (confirm('Are you sure you want to reset the scene? This action cannot be undone.')) {
    console.log('Resetting scene...')
    showNotification('Scene reset successfully!', 'success')
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
  console.log(`${type.toUpperCase()}: ${message}`)
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const checkMobile = () => {
  const isMobile = window.innerWidth <= 1200
  if (isMobile && !isCollapsed.value) {
    // Auto-collapse on smaller screens
    // isCollapsed.value = true
  }
}

// Time simulation
let timeInterval: number | null = null

const startTimeSimulation = () => {
  timeInterval = setInterval(() => {
    if (!isPaused.value) {
      currentTime.value += (timeSpeed.value * 0.1) / 60 // Increment by speed factor
      if (currentTime.value >= 24) {
        currentTime.value = 0
        // Advance season progress
        if (autoSeasonChange.value) {
          seasonProgress.value += 1
          if (seasonProgress.value > seasonDuration.value) {
            // Auto advance season
            const currentIndex = seasonOptions.value.findIndex(s => s.name === currentSeason.value.name)
            const nextIndex = (currentIndex + 1) % seasonOptions.value.length
            setSeason(seasonOptions.value[nextIndex])
          }
        }
      }
    }
  }, 1000) // Update every second
}

const stopTimeSimulation = () => {
  if (timeInterval) {
    clearInterval(timeInterval)
    timeInterval = null
  }
}

// Lifecycle
onMounted(() => {
  checkMobile()
  startTimeSimulation()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  window.addEventListener('resize', checkMobile)
  
  console.log('RightDock initialized')
})

onUnmounted(() => {
  stopTimeSimulation()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  window.removeEventListener('resize', checkMobile)
})

// Watch for graphics changes
watch(() => graphicsSettings.value.quality, () => {
  if (graphicsSettings.value.quality !== 'custom') {
    applyGraphicsPreset()
  }
}, { immediate: true })
</script>

<style scoped>
/* Right Dock Styles */
.right-dock {
  grid-area: controls;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-left: 1px solid var(--glass-border);
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  overflow-y: auto;
  position: relative;
  width: 320px;
  transition: width 0.3s ease;
}

.right-dock.collapsed {
  width: 80px;
  padding: var(--space-6) var(--space-2);
}

.right-dock::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent,
    var(--secondary-500),
    var(--accent-500),
    var(--primary-500),
    transparent
  );
  animation: controls-glow 8s ease-in-out infinite;
}

@keyframes controls-glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

/* Dock Header */
.dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.dock-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--neutral-700);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.title-icon {
  font-size: var(--text-xl);
}

.dock-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--neutral-500);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dock-toggle-btn:hover {
  background: var(--secondary-50);
  color: var(--secondary-600);
  transform: scale(1.05);
}

.toggle-icon {
  font-size: var(--text-sm);
}

/* Control Sections */
.control-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
}

.control-section {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  position: relative;
}

.control-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  opacity: 0.6;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  cursor: pointer;
  transition: background 0.2s ease;
}

.section-header:hover {
  background: var(--glass-bg);
}

.section-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.section-icon {
  font-size: var(--text-xl);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-100);
  border-radius: var(--radius-lg);
  color: var(--primary-600);
}

.section-title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
}

.section-toggle {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--neutral-500);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-toggle:hover {
  color: var(--primary-600);
}

.section-toggle.active {
  transform: rotate(0deg);
}

.section-content {
  padding: 0 var(--space-4) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Weather Controls */
.weather-current {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--glass-bg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
}

.weather-icon {
  font-size: var(--text-2xl);
  animation: weather-bob 3s ease-in-out infinite;
}

@keyframes weather-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.weather-info {
  flex: 1;
}

.weather-type {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--neutral-700);
}

.weather-temp {
  font-size: var(--text-sm);
  color: var(--neutral-500);
  font-variant-numeric: tabular-nums;
}

.weather-intensity {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
}

.intensity-label {
  font-size: var(--text-xs);
  color: var(--neutral-500);
}

.intensity-bar {
  width: 40px;
  height: 4px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.intensity-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  transition: width 0.3s ease;
}

.weather-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.weather-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.weather-option:hover {
  background: var(--primary-50);
  border-color: var(--primary-200);
  transform: scale(1.05);
}

.weather-option.active {
  background: var(--primary-100);
  border-color: var(--primary-500);
  color: var(--primary-700);
}

.weather-option-icon {
  font-size: var(--text-lg);
}

.weather-option-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.weather-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.control-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--neutral-600);
  min-width: 60px;
}

.weather-slider {
  flex: 1;
  height: 4px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
}

.weather-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--primary-500);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.control-value {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Time Controls */
.time-display {
  text-align: center;
  padding: var(--space-4);
  background: var(--glass-bg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
}

.time-current {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--primary-600);
  font-variant-numeric: tabular-nums;
}

.time-period {
  font-size: var(--text-sm);
  color: var(--neutral-500);
  margin-top: var(--space-1);
}

.time-speed {
  font-size: var(--text-xs);
  color: var(--accent-600);
  margin-top: var(--space-1);
}

.time-slider-container {
  position: relative;
  margin: var(--space-4) 0;
}

.time-slider {
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, var(--accent-500), var(--primary-500), var(--secondary-500));
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
}

.time-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid var(--primary-500);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-md);
}

.time-markers {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-2);
  position: relative;
}

.time-marker {
  position: absolute;
  font-size: var(--text-xs);
  color: var(--neutral-500);
  transform: translateX(-50%);
}

.time-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.time-control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-control-btn:hover {
  background: var(--primary-50);
  border-color: var(--primary-200);
}

.time-control-btn.active {
  background: var(--primary-100);
  border-color: var(--primary-500);
  color: var(--primary-700);
}

.speed-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.speed-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-1);
}

.speed-btn {
  padding: var(--space-2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-xs);
}

.speed-btn:hover {
  background: var(--secondary-50);
  border-color: var(--secondary-200);
}

.speed-btn.active {
  background: var(--secondary-100);
  border-color: var(--secondary-500);
  color: var(--secondary-700);
}

/* Season Controls */
.season-current {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--glass-bg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
}

.season-icon {
  font-size: var(--text-2xl);
}

.season-name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--neutral-700);
}

.season-progress {
  font-size: var(--text-sm);
  color: var(--neutral-500);
}

.season-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.season-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.season-option:hover {
  background: var(--accent-50);
  border-color: var(--accent-200);
}

.season-option.active {
  background: var(--accent-100);
  border-color: var(--accent-500);
  color: var(--accent-700);
}

.season-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--neutral-600);
  cursor: pointer;
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-500);
}

.duration-slider,
.setting-slider {
  width: 100%;
  height: 4px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  outline: none;
  cursor: pointer;
}

.duration-slider::-webkit-slider-thumb,
.setting-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--accent-500);
  border-radius: 50%;
  cursor: pointer;
}

/* Graphics Controls */
.graphics-preset {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.quality-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  color: var(--neutral-700);
  font-size: var(--text-sm);
}

.graphics-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid var(--glass-border);
}

.right-dock.collapsed .quick-actions {
  grid-template-columns: 1fr;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.right-dock.collapsed .quick-action-btn {
  padding: var(--space-3);
}

.quick-action-btn:hover:not(:disabled) {
  background: var(--secondary-50);
  border-color: var(--secondary-200);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.quick-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: var(--text-xl);
  color: var(--secondary-600);
}

.action-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--neutral-600);
  text-align: center;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .right-dock {
    position: fixed;
    bottom: 48px;
    right: 0;
    top: 72px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 30;
    width: 300px;
  }
  
  .right-dock.open {
    transform: translateX(0);
  }
  
  .weather-options {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .season-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .right-dock {
    width: 100vw;
    right: 0;
    border-radius: 0;
  }
  
  .weather-options {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .weather-bob,
  .controls-glow {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .control-section::before {
    opacity: 1;
  }
  
  .weather-option.active,
  .season-option.active,
  .speed-btn.active {
    border-width: 2px;
  }
}
</style>