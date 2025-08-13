<template>
  <div class="scene-canvas-container" ref="containerRef">
    <canvas 
      ref="canvasRef" 
      @click="handleCanvasClick"
      @mousemove="handleCanvasMouseMove"
      @mousedown="handleCanvasMouseDown"
      @mouseup="handleCanvasMouseUp"
      @wheel="handleCanvasWheel"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @contextmenu="handleContextMenu"
    />
    
    <!-- Loading Overlay -->
    <Transition name="loading" appear>
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ loadingMessage }}</div>
          <div class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ Math.round(loadingProgress) }}%</span>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Performance Monitor -->
    <div v-if="showPerformanceMonitor" class="performance-monitor">
      <div class="monitor-item">
        <span class="monitor-label">FPS:</span>
        <span class="monitor-value" :class="getFPSClass(currentFPS)">{{ currentFPS }}</span>
      </div>
      <div class="monitor-item">
        <span class="monitor-label">Draw Calls:</span>
        <span class="monitor-value">{{ renderStats.drawCalls }}</span>
      </div>
      <div class="monitor-item">
        <span class="monitor-label">Triangles:</span>
        <span class="monitor-value">{{ formatNumber(renderStats.triangles) }}</span>
      </div>
      <div class="monitor-item">
        <span class="monitor-label">Memory:</span>
        <span class="monitor-value">{{ formatMemory(renderStats.memory) }}</span>
      </div>
    </div>
    
    <!-- Scene Info -->
    <div v-if="sceneInfo" class="scene-info">
      <div class="info-item">
        <span class="info-label">Objects:</span>
        <span class="info-value">{{ sceneInfo.objectCount }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Lights:</span>
        <span class="info-value">{{ sceneInfo.lightCount }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Materials:</span>
        <span class="info-value">{{ sceneInfo.materialCount }}</span>
      </div>
    </div>
    
    <!-- Debug Info (Development Only) -->
    <div v-if="isDevelopment && showDebugInfo" class="debug-info">
      <div class="debug-section">
        <h4>Camera</h4>
        <div>Position: {{ formatVector(cameraPosition) }}</div>
        <div>Target: {{ formatVector(cameraTarget) }}</div>
        <div>Zoom: {{ cameraZoom.toFixed(2) }}</div>
      </div>
      <div class="debug-section">
        <h4>Selection</h4>
        <div>Selected: {{ selectedObject?.name || 'None' }}</div>
        <div>Hover: {{ hoveredObject?.name || 'None' }}</div>
      </div>
      <div class="debug-section">
        <h4>Environment</h4>
        <div>Weather: {{ currentWeather }}</div>
        <div>Time: {{ formatTime(currentTime) }}</div>
        <div>Season: {{ currentSeason }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ThreeJSCore } from '../../core/ThreeJSCore'
import { ModelSystem } from '../../systems/ModelSystem'
import { EnvironmentSystem } from '../../systems/EnvironmentSystem'
import { InteractionSystem } from '../../systems/InteractionSystem'

// Types
interface RenderStats {
  drawCalls: number
  triangles: number
  memory: number
}

interface SceneInfo {
  objectCount: number
  lightCount: number
  materialCount: number
}

interface Vector3 {
  x: number
  y: number
  z: number
}

// Props
interface Props {
  enablePerformanceMonitor?: boolean
  enableDebugInfo?: boolean
  autoResize?: boolean
  pixelRatio?: number
  antialias?: boolean
  shadows?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enablePerformanceMonitor: false,
  enableDebugInfo: false,
  autoResize: true,
  pixelRatio: window.devicePixelRatio || 1,
  antialias: true,
  shadows: true
})

// Emits
const emit = defineEmits<{
  'scene-ready': []
  'object-selected': [object: any]
  'object-deselected': []
  'object-hover': [object: any]
  'object-added': [object: any]
  'object-removed': [object: any]
  'camera-moved': [position: Vector3, target: Vector3]
  'performance-warning': [issue: string]
  'loading-progress': [progress: number, message: string]
  'error': [error: Error]
}>()

// Template refs
const containerRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()

// Core Three.js systems
let threeJSCore: ThreeJSCore | null = null
let modelSystem: ModelSystem | null = null
let environmentSystem: EnvironmentSystem | null = null
let interactionSystem: InteractionSystem | null = null

// Reactive state
const isLoading = ref(true)
const loadingMessage = ref('Initializing 3D Engine...')
const loadingProgress = ref(0)
const isInitialized = ref(false)
const showPerformanceMonitor = ref(props.enablePerformanceMonitor)
const showDebugInfo = ref(props.enableDebugInfo)
const isDevelopment = ref(process.env.NODE_ENV === 'development')

// Performance monitoring
const currentFPS = ref(60)
const renderStats = ref<RenderStats>({
  drawCalls: 0,
  triangles: 0,
  memory: 0
})

// Scene information
const sceneInfo = ref<SceneInfo>({
  objectCount: 0,
  lightCount: 0,
  materialCount: 0
})

// Camera state
const cameraPosition = ref<Vector3>({ x: 0, y: 10, z: 10 })
const cameraTarget = ref<Vector3>({ x: 0, y: 0, z: 0 })
const cameraZoom = ref(1)

// Selection state
const selectedObject = ref<any>(null)
const hoveredObject = ref<any>(null)

// Environment state
const currentWeather = ref('Sunny')
const currentTime = ref(12)
const currentSeason = ref('Spring')

// Animation loop
let animationId: number | null = null
let lastFrameTime = 0
let frameCount = 0
let fpsUpdateTime = 0

// Methods
const initThreeJS = async () => {
  if (!containerRef.value || !canvasRef.value || isInitialized.value) return
  
  try {
    updateLoadingProgress(10, 'Setting up 3D renderer...')
    console.log('🚀 Initializing modern Three.js systems...')
    
    // Wait for canvas to be properly sized
    await nextTick()
    
    // Initialize core Three.js
    threeJSCore = new ThreeJSCore()
    const context = threeJSCore.initialize({
      canvas: canvasRef.value,
      container: containerRef.value,
      antialias: props.antialias,
      shadows: props.shadows,
      pixelRatio: props.pixelRatio
    })
    
    updateLoadingProgress(30, 'Loading 3D models...')
    
    // Initialize systems
    modelSystem = new ModelSystem()
    modelSystem.initialize(context)
    
    updateLoadingProgress(50, 'Setting up environment...')
    
    environmentSystem = new EnvironmentSystem()
    environmentSystem.initialize(context)
    await environmentSystem.initializeEffects()
    
    updateLoadingProgress(70, 'Configuring interactions...')
    
    interactionSystem = new InteractionSystem()
    interactionSystem.initialize(context)
    
    updateLoadingProgress(85, 'Finalizing setup...')
    
    // Setup event listeners
    setupEventListeners()
    
    // Start render loop
    startRenderLoop()
    
    updateLoadingProgress(100, 'Ready!')
    
    // Complete initialization
    setTimeout(() => {
      isLoading.value = false
      isInitialized.value = true
      emit('scene-ready')
      console.log('✅ Three.js systems initialized successfully!')
    }, 500)
    
  } catch (error) {
    console.error('❌ Failed to initialize Three.js:', error)
    emit('error', error as Error)
    updateLoadingProgress(0, 'Initialization failed')
  }
}

const setupEventListeners = () => {
  if (!interactionSystem) return
  
  // Model interaction events
  interactionSystem.on('object-selected', (object) => {
    selectedObject.value = object
    emit('object-selected', object)
    console.log('Object selected:', object.name)
  })
  
  interactionSystem.on('object-deselected', () => {
    selectedObject.value = null
    emit('object-deselected')
    console.log('Object deselected')
  })
  
  interactionSystem.on('object-hover', (object) => {
    hoveredObject.value = object
    emit('object-hover', object)
  })
  
  interactionSystem.on('object-added', (object) => {
    updateSceneInfo()
    emit('object-added', object)
    console.log('Object added:', object.name)
  })
  
  interactionSystem.on('object-removed', (object) => {
    updateSceneInfo()
    emit('object-removed', object)
    console.log('Object removed:', object.name)
  })
  
  interactionSystem.on('camera-moved', (position, target) => {
    cameraPosition.value = position
    cameraTarget.value = target
    emit('camera-moved', position, target)
  })
}

const startRenderLoop = () => {
  if (!threeJSCore) return
  
  const animate = (currentTime: number) => {
    animationId = requestAnimationFrame(animate)
    
    const deltaTime = (currentTime - lastFrameTime) / 1000
    lastFrameTime = currentTime
    
    // Update systems
    if (modelSystem) modelSystem.update(deltaTime)
    if (environmentSystem) environmentSystem.update(deltaTime)
    if (interactionSystem) interactionSystem.update(deltaTime)
    
    // Render scene
    threeJSCore.render()
    
    // Update performance monitoring
    updatePerformanceStats(currentTime)
    
    // Update scene info periodically
    if (frameCount % 60 === 0) { // Every 60 frames
      updateSceneInfo()
    }
    
    frameCount++
  }
  
  animate(0)
}

const stopRenderLoop = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

const updatePerformanceStats = (currentTime: number) => {
  // Calculate FPS
  if (currentTime - fpsUpdateTime >= 1000) { // Update every second
    const fps = Math.round(frameCount * 1000 / (currentTime - fpsUpdateTime))
    currentFPS.value = fps
    fpsUpdateTime = currentTime
    frameCount = 0
    
    // Performance warning
    if (fps < 30) {
      emit('performance-warning', `Low FPS: ${fps}`)
    }
  }
  
  // Update render stats
  if (threeJSCore) {
    const stats = threeJSCore.getRenderStats()
    renderStats.value = {
      drawCalls: stats.drawCalls || 0,
      triangles: stats.triangles || 0,
      memory: stats.memory || 0
    }
  }
}

const updateSceneInfo = () => {
  if (!threeJSCore) return
  
  const scene = threeJSCore.getScene()
  let objectCount = 0
  let lightCount = 0
  const materialSet = new Set()
  
  scene.traverse((object) => {
    if (object.type !== 'Scene') {
      objectCount++
    }
    
    if (object.isLight) {
      lightCount++
    }
    
    if ((object as any).material) {
      const material = (object as any).material
      if (Array.isArray(material)) {
        material.forEach(mat => materialSet.add(mat.uuid))
      } else {
        materialSet.add(material.uuid)
      }
    }
  })
  
  sceneInfo.value = {
    objectCount,
    lightCount,
    materialCount: materialSet.size
  }
}

const updateLoadingProgress = (progress: number, message: string) => {
  loadingProgress.value = progress
  loadingMessage.value = message
  emit('loading-progress', progress, message)
}

const handleResize = () => {
  if (!containerRef.value || !threeJSCore || !props.autoResize) return
  
  const container = containerRef.value
  threeJSCore.handleResize(container)
  
  console.log('Canvas resized:', container.clientWidth, 'x', container.clientHeight)
}

// Event handlers
const handleCanvasClick = (event: MouseEvent) => {
  if (!interactionSystem) return
  interactionSystem.handleClick(event)
}

const handleCanvasMouseMove = (event: MouseEvent) => {
  if (!interactionSystem) return
  interactionSystem.handleMouseMove(event)
}

const handleCanvasMouseDown = (event: MouseEvent) => {
  if (!interactionSystem) return
  interactionSystem.handleMouseDown(event)
}

const handleCanvasMouseUp = (event: MouseEvent) => {
  if (!interactionSystem) return
  interactionSystem.handleMouseUp(event)
}

const handleCanvasWheel = (event: WheelEvent) => {
  if (!interactionSystem) return
  interactionSystem.handleWheel(event)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (data && modelSystem) {
      const itemData = JSON.parse(data)
      const rect = canvasRef.value!.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      modelSystem.addModelAtScreenPosition(itemData, x, y)
      console.log('Item dropped:', itemData.name, 'at', x, y)
    }
  } catch (error) {
    console.error('Drop handling failed:', error)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  // Could show context menu here
}

// Utility functions
const getFPSClass = (fps: number): string => {
  if (fps >= 55) return 'fps-excellent'
  if (fps >= 45) return 'fps-good'
  if (fps >= 30) return 'fps-fair'
  return 'fps-poor'
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatMemory = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return bytes + 'B'
}

const formatVector = (vector: Vector3): string => {
  return `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${vector.z.toFixed(1)})`
}

const formatTime = (time: number): string => {
  const hours = Math.floor(time)
  const minutes = Math.floor((time - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Public methods (exposed to parent)
const getThreeJSCore = () => threeJSCore
const getModelSystem = () => modelSystem
const getEnvironmentSystem = () => environmentSystem
const getInteractionSystem = () => interactionSystem

const takeScreenshot = async (width?: number, height?: number): Promise<string> => {
  if (!threeJSCore) throw new Error('Three.js not initialized')
  return threeJSCore.takeScreenshot(width, height)
}

const exportScene = () => {
  if (!modelSystem) throw new Error('Model system not initialized')
  return modelSystem.exportScene()
}

const importScene = (sceneData: any) => {
  if (!modelSystem) throw new Error('Model system not initialized')
  return modelSystem.importScene(sceneData)
}

const resetScene = () => {
  if (!modelSystem) throw new Error('Model system not initialized')
  modelSystem.clearScene()
  updateSceneInfo()
}

defineExpose({
  getThreeJSCore,
  getModelSystem,
  getEnvironmentSystem,
  getInteractionSystem,
  takeScreenshot,
  exportScene,
  importScene,
  resetScene
})

// Lifecycle
onMounted(async () => {
  await initThreeJS()
  if (props.autoResize) {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  stopRenderLoop()
  
  if (props.autoResize) {
    window.removeEventListener('resize', handleResize)
  }
  
  // Dispose all systems
  try {
    interactionSystem?.dispose()
    environmentSystem?.dispose()
    modelSystem?.dispose()
    threeJSCore?.dispose()
    console.log('✅ Three.js systems disposed successfully')
  } catch (error) {
    console.error('❌ Error disposing Three.js systems:', error)
  }
})

// Watch for prop changes
watch(() => props.enablePerformanceMonitor, (newValue) => {
  showPerformanceMonitor.value = newValue
})

watch(() => props.enableDebugInfo, (newValue) => {
  showDebugInfo.value = newValue
})
</script>

<style scoped>
.scene-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  text-align: center;
  color: white;
  max-width: 300px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-500);
  animation: spin 1s ease-in-out infinite;
  margin: 0 auto var(--space-4);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-4);
}

.loading-progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  min-width: 40px;
  text-align: right;
}

/* Performance Monitor */
.performance-monitor {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  z-index: 10;
}

.monitor-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.monitor-item:last-child {
  margin-bottom: 0;
}

.monitor-label {
  color: var(--neutral-500);
}

.monitor-value {
  color: var(--neutral-700);
  font-weight: var(--font-semibold);
}

.monitor-value.fps-excellent { color: var(--success); }
.monitor-value.fps-good { color: var(--primary-500); }
.monitor-value.fps-fair { color: var(--warning); }
.monitor-value.fps-poor { color: var(--error); }

/* Scene Info */
.scene-info {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  font-size: var(--text-xs);
  z-index: 10;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--neutral-500);
}

.info-value {
  color: var(--neutral-700);
  font-weight: var(--font-semibold);
}

/* Debug Info */
.debug-info {
  position: absolute;
  bottom: var(--space-4);
  left: var(--space-4);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  z-index: 10;
  max-width: 250px;
}

.debug-section {
  margin-bottom: var(--space-3);
}

.debug-section:last-child {
  margin-bottom: 0;
}

.debug-section h4 {
  color: var(--primary-600);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-1);
  text-transform: uppercase;
}

.debug-section div {
  color: var(--neutral-600);
  margin-bottom: 2px;
}

/* Transitions */
.loading-enter-active,
.loading-leave-active {
  transition: opacity 0.3s ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .performance-monitor,
  .scene-info {
    font-size: 10px;
    padding: var(--space-2);
  }
  
  .debug-info {
    bottom: var(--space-16); /* Account for mobile footer */
    font-size: 10px;
    padding: var(--space-2);
    max-width: 200px;
  }
  
  .loading-content {
    max-width: 250px;
    padding: 0 var(--space-4);
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
  }
  
  .loading-text {
    font-size: var(--text-base);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .performance-monitor,
  .scene-info,
  .debug-info {
    background: var(--neutral-0);
    border-color: var(--neutral-900);
    color: var(--neutral-900);
  }
  
  [data-theme="dark"] .performance-monitor,
  [data-theme="dark"] .scene-info,
  [data-theme="dark"] .debug-info {
    background: var(--neutral-900);
    border-color: var(--neutral-0);
    color: var(--neutral-0);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .progress-fill {
    transition: none;
  }
}
</style>