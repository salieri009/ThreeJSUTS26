<template>
  <div class="app" :data-theme="currentTheme">
    <HeaderBar @toggle-theme="toggleTheme" />
    <div class="app-shell">
      <LeftSidebar @category-selected="handleCategorySelected" />
      <main class="scene-container">
        <SceneCanvas 
          ref="sceneCanvasRef"
        />
        <CenterActions 
          @expand-terrain="handleExpandTerrain"
          @remove-selected="handleRemoveSelected"
        />
        <ItemPanel 
          ref="itemPanelRef"
          @item-selected="handleItemSelected"
        />
      </main>
      <RightDock 
        @season-changed="handleSeasonChanged"
        @weather-changed="handleWeatherChanged"
        @time-changed="handleTimeChanged"
        @wind-changed="handleWindChanged"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HeaderBar from './components/layout/HeaderBar.vue'
import LeftSidebar from './components/layout/LeftSidebar.vue'
import RightDock from './components/layout/RightDock.vue'
import SceneCanvas from './components/scene/SceneCanvas.vue'
import CenterActions from './components/overlay/CenterActions.vue'
import ItemPanel from './components/overlay/ItemPanel.vue'
import type { Season, Weather, TimeOfDay } from './systems/EnvironmentSystem'

const currentTheme = ref<'light' | 'dark'>('light')
const sceneCanvasRef = ref<InstanceType<typeof SceneCanvas>>()
const itemPanelRef = ref<InstanceType<typeof ItemPanel>>()

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', currentTheme.value)
}

// Environment control handlers
const handleSeasonChanged = (season: string) => {
  const environmentSystem = sceneCanvasRef.value?.getEnvironmentSystem()
  if (environmentSystem) {
    environmentSystem.setSeason(season as Season)
  }
}

const handleWeatherChanged = (weather: string) => {
  const environmentSystem = sceneCanvasRef.value?.getEnvironmentSystem()
  if (environmentSystem) {
    environmentSystem.setWeather(weather as Weather)
  }
}

const handleTimeChanged = (time: string) => {
  const environmentSystem = sceneCanvasRef.value?.getEnvironmentSystem()
  if (environmentSystem) {
    environmentSystem.setTimeOfDay(time as TimeOfDay)
  }
}

const handleWindChanged = (intensity: number) => {
  const environmentSystem = sceneCanvasRef.value?.getEnvironmentSystem()
  if (environmentSystem) {
    environmentSystem.setWindIntensity(intensity)
  }
}

// Model interaction handlers
const handleCategorySelected = (categoryId: string) => {
  // Show item panel for selected category
  if (itemPanelRef.value) {
    itemPanelRef.value.showPanel(categoryId)
  }
}

const handleItemSelected = (itemId: string) => {
  const modelSystem = sceneCanvasRef.value?.getModelSystem()
  const interactionSystem = sceneCanvasRef.value?.getInteractionSystem()
  
  if (modelSystem && interactionSystem) {
    const modelInstance = modelSystem.createModelInstance(itemId)
    if (modelInstance) {
      const modelData = modelSystem.getLoadedModels().get(itemId)
      if (modelData) {
        interactionSystem.startPlacement(modelInstance, {
          width: modelData.data.width,
          height: modelData.data.height
        })
      }
    }
  }
}

const handleExpandTerrain = () => {
  const interactionSystem = sceneCanvasRef.value?.getInteractionSystem()
  if (interactionSystem) {
    interactionSystem.expandTerrain()
  }
}

const handleRemoveSelected = () => {
  const interactionSystem = sceneCanvasRef.value?.getInteractionSystem()
  if (interactionSystem) {
    const state = interactionSystem.getState()
    if (state.selectedObject) {
      interactionSystem.removeModel(state.selectedObject)
    }
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (savedTheme) {
    currentTheme.value = savedTheme
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    currentTheme.value = 'dark'
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: Inter, system-ui, -apple-system, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.app-shell {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  height: calc(100vh - 72px);
  gap: 0;
}

.scene-container {
  position: relative;
  overflow: hidden;
  background: var(--bg-secondary);
}

@media (max-width: 1200px) {
  .app-shell {
    grid-template-columns: 280px 1fr;
  }
}

@media (max-width: 768px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}
</style>
