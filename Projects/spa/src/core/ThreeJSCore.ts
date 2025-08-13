/**
 * 🎯 Three.js Core System
 * Modern Three.js wrapper with performance optimization and clean API
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export interface ThreeJSConfig {
  canvas?: HTMLCanvasElement
  container: HTMLElement
  antialias?: boolean
  shadows?: boolean
  pixelRatio?: number
  alpha?: boolean
  premultipliedAlpha?: boolean
}

export interface ThreeJSContext {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  clock: THREE.Clock
  raycaster: THREE.Raycaster
  mouse: THREE.Vector2
}

export interface RenderStats {
  drawCalls: number
  triangles: number
  memory: number
  fps: number
}

export class ThreeJSCore {
  private scene!: THREE.Scene
  private camera!: THREE.OrthographicCamera
  private renderer!: THREE.WebGLRenderer
  private controls!: OrbitControls
  private clock!: THREE.Clock
  private raycaster!: THREE.Raycaster
  private mouse!: THREE.Vector2
  
  private container!: HTMLElement
  private animationId: number | null = null
  private renderCallback?: (deltaTime: number) => void
  
  // Performance monitoring
  private stats: RenderStats = {
    drawCalls: 0,
    triangles: 0,
    memory: 0,
    fps: 60
  }
  
  private frameCount = 0
  private lastTime = 0
  
  // Lighting system
  private ambientLight!: THREE.AmbientLight
  private directionalLight!: THREE.DirectionalLight
  private hemisphereLight!: THREE.HemisphereLight
  
  /**
   * Initialize Three.js core systems
   */
  initialize(config: ThreeJSConfig): ThreeJSContext {
    this.container = config.container
    
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB) // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200)
    
    // Create camera
    this.setupCamera()
    
    // Create renderer
    this.setupRenderer(config)
    
    // Create controls
    this.setupControls()
    
    // Setup lighting
    this.setupLighting()
    
    // Setup helpers
    this.setupHelpers()
    
    // Setup event listeners
    this.setupEventListeners()
    
    console.log('✅ Three.js Core initialized')
    
    return this.getContext()
  }
  
  /**
   * Setup orthographic camera for isometric view
   */
  private setupCamera(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    const aspect = width / height
    const frustumSize = 20
    
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    )
    
    // Position camera for isometric view
    this.camera.position.set(20, 20, 20)
    this.camera.lookAt(0, 0, 0)
  }
  
  /**
   * Setup WebGL renderer with optimizations
   */
  private setupRenderer(config: ThreeJSConfig): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      antialias: config.antialias ?? true,
      alpha: config.alpha ?? false,
      premultipliedAlpha: config.premultipliedAlpha ?? false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    })
    
    // Basic settings
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(config.pixelRatio ?? window.devicePixelRatio, 2))
    
    // Shadow settings
    if (config.shadows) {
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
      this.renderer.shadowMap.autoUpdate = true
    }
    
    // Performance optimizations
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    
    // Append to container if canvas not provided
    if (!config.canvas) {
      this.container.appendChild(this.renderer.domElement)
    }
  }
  
  /**
   * Setup orbit controls for camera interaction
   */
  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    
    // Control settings for farm simulation
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = false
    
    // Limit controls for better UX
    this.controls.minDistance = 10
    this.controls.maxDistance = 100
    this.controls.maxPolarAngle = Math.PI / 2.2 // Prevent going under ground
    
    // Smooth controls
    this.controls.enableRotate = true
    this.controls.enableZoom = true
    this.controls.enablePan = true
    
    // Auto rotation (optional)
    this.controls.autoRotate = false
    this.controls.autoRotateSpeed = 0.5
  }
  
  /**
   * Setup lighting system for outdoor farm environment
   */
  private setupLighting(): void {
    // Ambient light for general illumination
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(this.ambientLight)
    
    // Hemisphere light for sky/ground gradient
    this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.6)
    this.hemisphereLight.position.set(0, 50, 0)
    this.scene.add(this.hemisphereLight)
    
    // Directional light for sun
    this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
    this.directionalLight.position.set(30, 50, 30)
    this.directionalLight.castShadow = true
    
    // Shadow camera settings
    const shadowCamera = this.directionalLight.shadow.camera
    shadowCamera.near = 1
    shadowCamera.far = 200
    shadowCamera.left = -50
    shadowCamera.right = 50
    shadowCamera.top = 50
    shadowCamera.bottom = -50
    
    // Shadow quality
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.bias = -0.0001
    
    this.scene.add(this.directionalLight)
  }
  
  /**
   * Setup helper objects and utilities
   */
  private setupHelpers(): void {
    this.clock = new THREE.Clock()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // Grid helper for development
    if (import.meta.env.DEV) {
      const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0xcccccc)
      gridHelper.position.y = 0.01 // Slightly above ground
      this.scene.add(gridHelper)
      
      // Axes helper
      const axesHelper = new THREE.AxesHelper(10)
      this.scene.add(axesHelper)
    }
  }
  
  /**
   * Setup event listeners for interaction
   */
  private setupEventListeners(): void {
    // Mouse tracking
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    })
    
    // Prevent context menu
    this.renderer.domElement.addEventListener('contextmenu', (event) => {
      event.preventDefault()
    })
  }
  
  /**
   * Start the render loop
   */
  startRenderLoop(callback?: (deltaTime: number) => void): void {
    this.renderCallback = callback
    this.animate()
  }
  
  /**
   * Stop the render loop
   */
  stopRenderLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
  
  /**
   * Main animation loop
   */
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)
    
    const deltaTime = this.clock.getDelta()
    
    // Update controls
    this.controls.update()
    
    // Update performance stats
    this.updateStats(deltaTime)
    
    // Call external update callback
    if (this.renderCallback) {
      this.renderCallback(deltaTime)
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera)
  }
  
  /**
   * Update performance statistics
   */
  private updateStats(deltaTime: number): void {
    this.frameCount++
    
    // Update FPS every second
    const currentTime = performance.now()
    if (currentTime - this.lastTime >= 1000) {
      this.stats.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime
    }
    
    // Update render stats
    const info = this.renderer.info
    this.stats.drawCalls = info.render.calls
    this.stats.triangles = info.render.triangles
    this.stats.memory = info.memory.geometries + info.memory.textures
  }
  
  /**
   * Handle window resize
   */
  handleResize(container?: HTMLElement): void {
    const targetContainer = container || this.container
    const width = targetContainer.clientWidth
    const height = targetContainer.clientHeight
    const aspect = width / height
    const frustumSize = 20
    
    // Update camera
    this.camera.left = -frustumSize * aspect / 2
    this.camera.right = frustumSize * aspect / 2
    this.camera.top = frustumSize / 2
    this.camera.bottom = -frustumSize / 2
    this.camera.updateProjectionMatrix()
    
    // Update renderer
    this.renderer.setSize(width, height)
    
    console.log('📐 Three.js resized:', width, 'x', height)
  }
  
  /**
   * Update lighting based on time of day
   */
  updateLighting(timeOfDay: number, weather: string): void {
    // Time of day (0-24 hours)
    const normalizedTime = (timeOfDay % 24) / 24
    
    // Sun position based on time
    const sunAngle = (normalizedTime - 0.25) * Math.PI * 2 // Noon at 0.5
    const sunHeight = Math.sin(sunAngle) * 50
    const sunDistance = Math.cos(sunAngle) * 50
    
    this.directionalLight.position.set(sunDistance, Math.max(sunHeight, 5), sunDistance)
    
    // Light intensity based on time
    let intensity = 0.8
    if (normalizedTime < 0.25 || normalizedTime > 0.75) { // Night
      intensity = 0.2
    } else if (normalizedTime < 0.3 || normalizedTime > 0.7) { // Dawn/Dusk
      intensity = 0.5
    }
    
    // Weather modifications
    switch (weather.toLowerCase()) {
      case 'cloudy':
        intensity *= 0.7
        break
      case 'rainy':
      case 'stormy':
        intensity *= 0.5
        break
      case 'foggy':
        intensity *= 0.6
        break
      case 'snowy':
        intensity *= 0.8
        break
    }
    
    this.directionalLight.intensity = intensity
    this.ambientLight.intensity = intensity * 0.5
  }
  
  /**
   * Get raycast intersection with scene objects
   */
  raycast(excludeObjects?: THREE.Object3D[]): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    let objects = this.scene.children
    if (excludeObjects) {
      objects = objects.filter(obj => !excludeObjects.includes(obj))
    }
    
    return this.raycaster.intersectObjects(objects, true)
  }
  
  /**
   * Take a screenshot of the current scene
   */
  takeScreenshot(width?: number, height?: number): string {
    const originalWidth = this.renderer.domElement.width
    const originalHeight = this.renderer.domElement.height
    
    if (width && height) {
      this.renderer.setSize(width, height, false)
      this.renderer.render(this.scene, this.camera)
    }
    
    const dataURL = this.renderer.domElement.toDataURL('image/png')
    
    // Restore original size
    if (width && height) {
      this.renderer.setSize(originalWidth, originalHeight, false)
    }
    
    return dataURL
  }
  
  /**
   * Get current context for other systems
   */
  getContext(): ThreeJSContext {
    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls,
      clock: this.clock,
      raycaster: this.raycaster,
      mouse: this.mouse
    }
  }
  
  /**
   * Get render statistics
   */
  getRenderStats(): RenderStats {
    return { ...this.stats }
  }
  
  /**
   * Get scene reference
   */
  getScene(): THREE.Scene {
    return this.scene
  }
  
  /**
   * Get camera reference
   */
  getCamera(): THREE.OrthographicCamera {
    return this.camera
  }
  
  /**
   * Get renderer reference
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }
  
  /**
   * Render single frame (for external control)
   */
  render(): void {
    this.renderer.render(this.scene, this.camera)
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopRenderLoop()
    
    // Dispose renderer
    this.renderer.dispose()
    
    // Dispose controls
    this.controls.dispose()
    
    // Clean up scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        }
      }
    })
    
    // Clear scene
    this.scene.clear()
    
    console.log('🧹 Three.js Core disposed')
  }
}