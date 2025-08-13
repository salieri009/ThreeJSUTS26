/**
 * 🌦️ Environment System
 * Weather, seasons, time of day, and environmental effects
 */

import * as THREE from 'three'
import { ThreeJSContext } from '../core/ThreeJSCore'

export interface WeatherState {
  type: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy'
  intensity: number // 0-100
  temperature: number // Celsius
  humidity: number // 0-100
  windSpeed: number // m/s
  windDirection: number // degrees
}

export interface SeasonState {
  type: 'spring' | 'summer' | 'autumn' | 'winter'
  progress: number // 0-1 (0 = start, 1 = end)
  dayLength: number // hours of daylight
  temperature: { min: number; max: number }
}

export interface TimeState {
  hour: number // 0-23.99
  day: number // 1-365
  year: number
  speed: number // time multiplier
  paused: boolean
}

export class EnvironmentSystem {
  private context!: ThreeJSContext
  
  // Current states
  private weather: WeatherState = {
    type: 'sunny',
    intensity: 75,
    temperature: 22,
    humidity: 60,
    windSpeed: 5,
    windDirection: 0
  }
  
  private season: SeasonState = {
    type: 'spring',
    progress: 0.5,
    dayLength: 12,
    temperature: { min: 15, max: 25 }
  }
  
  private time: TimeState = {
    hour: 12,
    day: 100, // Spring day
    year: 2024,
    speed: 1,
    paused: false
  }
  
  // Particle systems
  private rainSystem?: THREE.Points
  private snowSystem?: THREE.Points
  private fogSystem?: THREE.Fog
  private windParticles?: THREE.Points
  
  // Sky and atmosphere
  private skybox?: THREE.Mesh
  private clouds?: THREE.Group
  private sun?: THREE.DirectionalLight
  private moon?: THREE.Mesh
  
  // Seasonal effects
  private springParticles?: THREE.Points // Cherry blossoms
  private summerParticles?: THREE.Points // Fireflies
  private autumnParticles?: THREE.Points // Falling leaves
  private winterEffects?: THREE.Group // Snow on objects
  
  // Animation tracking
  private particleTime = 0
  private cloudOffset = 0
  
  /**
   * Initialize environment system
   */
  initialize(context: ThreeJSContext): void {
    this.context = context
    this.setupSkybox()
    this.setupClouds()
    this.setupAtmosphere()
    
    console.log('✅ EnvironmentSystem initialized')
  }
  
  /**
   * Initialize all effects
   */
  async initializeEffects(): Promise<void> {
    this.createWeatherEffects()
    this.createSeasonalEffects()
    this.updateEnvironment()
    
    console.log('🌦️ Environment effects initialized')
  }
  
  /**
   * Setup skybox
   */
  private setupSkybox(): void {
    // Create gradient skybox
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32)
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    })
    
    this.skybox = new THREE.Mesh(skyGeometry, skyMaterial)
    this.context.scene.add(this.skybox)
  }
  
  /**
   * Setup cloud system
   */
  private setupClouds(): void {
    this.clouds = new THREE.Group()
    
    // Create several cloud layers
    for (let i = 0; i < 8; i++) {
      const cloudGeometry = new THREE.PlaneGeometry(20, 10)
      const cloudMaterial = new THREE.MeshLambertMaterial({
        map: this.createCloudTexture(),
        transparent: true,
        opacity: 0.6
      })
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial)
      cloud.position.set(
        (Math.random() - 0.5) * 200,
        20 + Math.random() * 20,
        (Math.random() - 0.5) * 200
      )
      cloud.rotation.y = Math.random() * Math.PI * 2
      
      this.clouds.add(cloud)
    }
    
    this.context.scene.add(this.clouds)
  }
  
  /**
   * Create cloud texture
   */
  private createCloudTexture(): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    
    // Create cloud gradient
    const gradient = ctx.createRadialGradient(64, 32, 0, 64, 32, 64)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 64)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    
    return texture
  }
  
  /**
   * Setup atmospheric effects
   */
  private setupAtmosphere(): void {
    // Setup fog based on weather
    this.updateFog()
    
    // Create moon
    const moonGeometry = new THREE.SphereGeometry(2, 16, 16)
    const moonMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: 0x222222
    })
    this.moon = new THREE.Mesh(moonGeometry, moonMaterial)
    this.moon.position.set(0, 50, -100)
    this.context.scene.add(this.moon)
  }
  
  /**
   * Create weather particle effects
   */
  private createWeatherEffects(): void {
    // Rain particles
    this.createRainEffect()
    
    // Snow particles
    this.createSnowEffect()
    
    // Wind particles
    this.createWindEffect()
  }
  
  /**
   * Create rain effect
   */
  private createRainEffect(): void {
    const rainCount = 1000
    const rainGeometry = new THREE.BufferGeometry()
    const rainPositions = new Float32Array(rainCount * 3)
    const rainVelocities = new Float32Array(rainCount * 3)
    
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 200 // x
      rainPositions[i + 1] = Math.random() * 100 + 50 // y
      rainPositions[i + 2] = (Math.random() - 0.5) * 200 // z
      
      rainVelocities[i] = 0 // x velocity
      rainVelocities[i + 1] = -10 - Math.random() * 10 // y velocity (falling)
      rainVelocities[i + 2] = 0 // z velocity
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3))
    rainGeometry.setAttribute('velocity', new THREE.BufferAttribute(rainVelocities, 3))
    
    const rainMaterial = new THREE.PointsMaterial({
      color: 0x87CEEB,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    })
    
    this.rainSystem = new THREE.Points(rainGeometry, rainMaterial)
    this.rainSystem.visible = false
    this.context.scene.add(this.rainSystem)
  }
  
  /**
   * Create snow effect
   */
  private createSnowEffect(): void {
    const snowCount = 500
    const snowGeometry = new THREE.BufferGeometry()
    const snowPositions = new Float32Array(snowCount * 3)
    const snowVelocities = new Float32Array(snowCount * 3)
    
    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPositions[i] = (Math.random() - 0.5) * 200
      snowPositions[i + 1] = Math.random() * 100 + 50
      snowPositions[i + 2] = (Math.random() - 0.5) * 200
      
      snowVelocities[i] = (Math.random() - 0.5) * 2 // gentle drift
      snowVelocities[i + 1] = -2 - Math.random() * 3 // slow falling
      snowVelocities[i + 2] = (Math.random() - 0.5) * 2
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3))
    snowGeometry.setAttribute('velocity', new THREE.BufferAttribute(snowVelocities, 3))
    
    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.8
    })
    
    this.snowSystem = new THREE.Points(snowGeometry, snowMaterial)
    this.snowSystem.visible = false
    this.context.scene.add(this.snowSystem)
  }
  
  /**
   * Create wind effect
   */
  private createWindEffect(): void {
    const windCount = 200
    const windGeometry = new THREE.BufferGeometry()
    const windPositions = new Float32Array(windCount * 3)
    
    for (let i = 0; i < windCount * 3; i += 3) {
      windPositions[i] = (Math.random() - 0.5) * 300
      windPositions[i + 1] = Math.random() * 20 + 5
      windPositions[i + 2] = (Math.random() - 0.5) * 300
    }
    
    windGeometry.setAttribute('position', new THREE.BufferAttribute(windPositions, 3))
    
    const windMaterial = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.05,
      transparent: true,
      opacity: 0.3
    })
    
    this.windParticles = new THREE.Points(windGeometry, windMaterial)
    this.windParticles.visible = false
    this.context.scene.add(this.windParticles)
  }
  
  /**
   * Create seasonal particle effects
   */
  private createSeasonalEffects(): void {
    this.createSpringEffect()
    this.createSummerEffect()
    this.createAutumnEffect()
    this.createWinterEffect()
  }
  
  /**
   * Create spring cherry blossom effect
   */
  private createSpringEffect(): void {
    const petalCount = 300
    const petalGeometry = new THREE.BufferGeometry()
    const petalPositions = new Float32Array(petalCount * 3)
    const petalColors = new Float32Array(petalCount * 3)
    
    for (let i = 0; i < petalCount * 3; i += 3) {
      petalPositions[i] = (Math.random() - 0.5) * 150
      petalPositions[i + 1] = Math.random() * 30 + 10
      petalPositions[i + 2] = (Math.random() - 0.5) * 150
      
      // Pink cherry blossom colors
      petalColors[i] = 1.0 // R
      petalColors[i + 1] = 0.7 + Math.random() * 0.3 // G
      petalColors[i + 2] = 0.8 + Math.random() * 0.2 // B
    }
    
    petalGeometry.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3))
    petalGeometry.setAttribute('color', new THREE.BufferAttribute(petalColors, 3))
    
    const petalMaterial = new THREE.PointsMaterial({
      size: 0.4,
      transparent: true,
      opacity: 0.7,
      vertexColors: true
    })
    
    this.springParticles = new THREE.Points(petalGeometry, petalMaterial)
    this.springParticles.visible = false
    this.context.scene.add(this.springParticles)
  }
  
  /**
   * Create summer firefly effect
   */
  private createSummerEffect(): void {
    const fireflyCount = 50
    const fireflyGeometry = new THREE.BufferGeometry()
    const fireflyPositions = new Float32Array(fireflyCount * 3)
    
    for (let i = 0; i < fireflyCount * 3; i += 3) {
      fireflyPositions[i] = (Math.random() - 0.5) * 100
      fireflyPositions[i + 1] = Math.random() * 15 + 5
      fireflyPositions[i + 2] = (Math.random() - 0.5) * 100
    }
    
    fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3))
    
    const fireflyMaterial = new THREE.PointsMaterial({
      color: 0xffff00,
      size: 0.3,
      transparent: true,
      opacity: 0.8
    })
    
    this.summerParticles = new THREE.Points(fireflyGeometry, fireflyMaterial)
    this.summerParticles.visible = false
    this.context.scene.add(this.summerParticles)
  }
  
  /**
   * Create autumn falling leaves effect
   */
  private createAutumnEffect(): void {
    const leafCount = 200
    const leafGeometry = new THREE.BufferGeometry()
    const leafPositions = new Float32Array(leafCount * 3)
    const leafColors = new Float32Array(leafCount * 3)
    
    for (let i = 0; i < leafCount * 3; i += 3) {
      leafPositions[i] = (Math.random() - 0.5) * 150
      leafPositions[i + 1] = Math.random() * 40 + 20
      leafPositions[i + 2] = (Math.random() - 0.5) * 150
      
      // Autumn colors (orange, red, yellow, brown)
      const colorType = Math.floor(Math.random() * 4)
      switch (colorType) {
        case 0: // Orange
          leafColors[i] = 1.0
          leafColors[i + 1] = 0.5
          leafColors[i + 2] = 0.0
          break
        case 1: // Red
          leafColors[i] = 0.8
          leafColors[i + 1] = 0.2
          leafColors[i + 2] = 0.1
          break
        case 2: // Yellow
          leafColors[i] = 1.0
          leafColors[i + 1] = 1.0
          leafColors[i + 2] = 0.0
          break
        case 3: // Brown
          leafColors[i] = 0.6
          leafColors[i + 1] = 0.3
          leafColors[i + 2] = 0.1
          break
      }
    }
    
    leafGeometry.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3))
    leafGeometry.setAttribute('color', new THREE.BufferAttribute(leafColors, 3))
    
    const leafMaterial = new THREE.PointsMaterial({
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      vertexColors: true
    })
    
    this.autumnParticles = new THREE.Points(leafGeometry, leafMaterial)
    this.autumnParticles.visible = false
    this.context.scene.add(this.autumnParticles)
  }
  
  /**
   * Create winter effects
   */
  private createWinterEffect(): void {
    this.winterEffects = new THREE.Group()
    // Winter effects would include snow accumulation on objects
    // This is a placeholder for more complex winter scene modifications
    this.context.scene.add(this.winterEffects)
  }
  
  /**
   * Update environment based on current states
   */
  private updateEnvironment(): void {
    this.updateSkyColor()
    this.updateLighting()
    this.updateWeatherEffects()
    this.updateSeasonalEffects()
    this.updateFog()
  }
  
  /**
   * Update sky color based on time and weather
   */
  private updateSkyColor(): void {
    if (!this.skybox) return
    
    const material = this.skybox.material as THREE.ShaderMaterial
    const timeOfDay = this.time.hour / 24
    
    let topColor: THREE.Color
    let bottomColor: THREE.Color
    
    // Time-based sky colors
    if (timeOfDay < 0.25 || timeOfDay > 0.75) { // Night
      topColor = new THREE.Color(0x000033)
      bottomColor = new THREE.Color(0x000066)
    } else if (timeOfDay < 0.3 || timeOfDay > 0.7) { // Dawn/Dusk
      topColor = new THREE.Color(0xff6600)
      bottomColor = new THREE.Color(0xffcc66)
    } else { // Day
      topColor = new THREE.Color(0x0077ff)
      bottomColor = new THREE.Color(0x87CEEB)
    }
    
    // Weather modifications
    switch (this.weather.type) {
      case 'cloudy':
        topColor = topColor.lerp(new THREE.Color(0x666666), 0.3)
        bottomColor = bottomColor.lerp(new THREE.Color(0x888888), 0.3)
        break
      case 'stormy':
        topColor = new THREE.Color(0x333333)
        bottomColor = new THREE.Color(0x555555)
        break
      case 'foggy':
        topColor = topColor.lerp(new THREE.Color(0xcccccc), 0.5)
        bottomColor = new THREE.Color(0xeeeeee)
        break
    }
    
    material.uniforms.topColor.value = topColor
    material.uniforms.bottomColor.value = bottomColor
  }
  
  /**
   * Update lighting system
   */
  private updateLighting(): void {
    // This would typically call the ThreeJSCore updateLighting method
    // For now, we'll update basic parameters
    const timeOfDay = this.time.hour
    const intensity = this.calculateLightIntensity(timeOfDay)
    
    // Update directional light (sun)
    if (this.context.scene.children.find(child => child instanceof THREE.DirectionalLight)) {
      const sun = this.context.scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight
      sun.intensity = intensity * (this.weather.intensity / 100)
    }
  }
  
  /**
   * Calculate light intensity based on time
   */
  private calculateLightIntensity(hour: number): number {
    const normalizedTime = (hour % 24) / 24
    
    if (normalizedTime < 0.25 || normalizedTime > 0.75) return 0.2 // Night
    if (normalizedTime < 0.3 || normalizedTime > 0.7) return 0.5 // Dawn/Dusk
    return 0.8 // Day
  }
  
  /**
   * Update weather particle effects
   */
  private updateWeatherEffects(): void {
    // Show/hide weather effects based on current weather
    if (this.rainSystem) {
      this.rainSystem.visible = this.weather.type === 'rainy' || this.weather.type === 'stormy'
    }
    
    if (this.snowSystem) {
      this.snowSystem.visible = this.weather.type === 'snowy'
    }
    
    if (this.windParticles) {
      this.windParticles.visible = this.weather.windSpeed > 10
    }
  }
  
  /**
   * Update seasonal effects
   */
  private updateSeasonalEffects(): void {
    // Hide all seasonal effects first
    if (this.springParticles) this.springParticles.visible = false
    if (this.summerParticles) this.summerParticles.visible = false
    if (this.autumnParticles) this.autumnParticles.visible = false
    if (this.winterEffects) this.winterEffects.visible = false
    
    // Show current season effect
    switch (this.season.type) {
      case 'spring':
        if (this.springParticles) this.springParticles.visible = true
        break
      case 'summer':
        if (this.summerParticles) this.summerParticles.visible = true
        break
      case 'autumn':
        if (this.autumnParticles) this.autumnParticles.visible = true
        break
      case 'winter':
        if (this.winterEffects) this.winterEffects.visible = true
        break
    }
  }
  
  /**
   * Update fog based on weather
   */
  private updateFog(): void {
    switch (this.weather.type) {
      case 'foggy':
        this.context.scene.fog = new THREE.Fog(0xcccccc, 10, 50)
        break
      case 'stormy':
        this.context.scene.fog = new THREE.Fog(0x666666, 20, 80)
        break
      default:
        this.context.scene.fog = new THREE.Fog(0x87CEEB, 50, 200)
        break
    }
  }
  
  /**
   * Update particle animations
   */
  private updateParticles(deltaTime: number): void {
    this.particleTime += deltaTime
    
    // Update rain particles
    if (this.rainSystem && this.rainSystem.visible) {
      const positions = this.rainSystem.geometry.attributes.position.array as Float32Array
      const velocities = this.rainSystem.geometry.attributes.velocity.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += velocities[i + 1] * deltaTime
        
        // Reset particle if it hits the ground
        if (positions[i + 1] < 0) {
          positions[i + 1] = 100 + Math.random() * 50
          positions[i] = (Math.random() - 0.5) * 200
          positions[i + 2] = (Math.random() - 0.5) * 200
        }
      }
      
      this.rainSystem.geometry.attributes.position.needsUpdate = true
    }
    
    // Update snow particles
    if (this.snowSystem && this.snowSystem.visible) {
      const positions = this.snowSystem.geometry.attributes.position.array as Float32Array
      const velocities = this.snowSystem.geometry.attributes.velocity.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime
        positions[i + 1] += velocities[i + 1] * deltaTime
        positions[i + 2] += velocities[i + 2] * deltaTime
        
        // Reset particle if it hits the ground
        if (positions[i + 1] < 0) {
          positions[i + 1] = 100 + Math.random() * 50
          positions[i] = (Math.random() - 0.5) * 200
          positions[i + 2] = (Math.random() - 0.5) * 200
        }
      }
      
      this.snowSystem.geometry.attributes.position.needsUpdate = true
    }
    
    // Update seasonal particles with gentle floating motion
    [this.springParticles, this.autumnParticles].forEach(particles => {
      if (particles && particles.visible) {
        const positions = particles.geometry.attributes.position.array as Float32Array
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += Math.sin(this.particleTime + i) * 0.01
          positions[i + 1] += Math.cos(this.particleTime + i) * 0.005 - 0.02
          positions[i + 2] += Math.sin(this.particleTime + i * 1.1) * 0.01
          
          // Reset if too low
          if (positions[i + 1] < 0) {
            positions[i + 1] = 40 + Math.random() * 20
          }
        }
        
        particles.geometry.attributes.position.needsUpdate = true
      }
    })
    
    // Update summer fireflies with random movement
    if (this.summerParticles && this.summerParticles.visible) {
      const positions = this.summerParticles.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += (Math.random() - 0.5) * 0.1
        positions[i + 1] += (Math.random() - 0.5) * 0.05
        positions[i + 2] += (Math.random() - 0.5) * 0.1
        
        // Keep within bounds
        positions[i] = Math.max(-50, Math.min(50, positions[i]))
        positions[i + 1] = Math.max(5, Math.min(20, positions[i + 1]))
        positions[i + 2] = Math.max(-50, Math.min(50, positions[i + 2]))
      }
      
      this.summerParticles.geometry.attributes.position.needsUpdate = true
    }
  }
  
  /**
   * Update cloud movement
   */
  private updateClouds(deltaTime: number): void {
    if (!this.clouds) return
    
    this.cloudOffset += deltaTime * 0.5 // Slow cloud movement
    
    this.clouds.children.forEach((cloud, index) => {
      cloud.position.x += Math.sin(this.cloudOffset + index) * 0.1
      cloud.position.z += Math.cos(this.cloudOffset + index * 1.1) * 0.05
    })
  }
  
  /**
   * Set weather state
   */
  setWeather(weather: Partial<WeatherState>): void {
    this.weather = { ...this.weather, ...weather }
    this.updateEnvironment()
    
    console.log(`🌦️ Weather changed to ${this.weather.type} (${this.weather.intensity}%)`)
  }
  
  /**
   * Set season state
   */
  setSeason(season: Partial<SeasonState>): void {
    this.season = { ...this.season, ...season }
    this.updateEnvironment()
    
    console.log(`🍂 Season changed to ${this.season.type}`)
  }
  
  /**
   * Set time state
   */
  setTime(time: Partial<TimeState>): void {
    this.time = { ...this.time, ...time }
    this.updateEnvironment()
    
    console.log(`🕐 Time set to ${this.time.hour.toFixed(1)}:00`)
  }
  
  /**
   * Get current states
   */
  getWeather(): WeatherState { return { ...this.weather } }
  getSeason(): SeasonState { return { ...this.season } }
  getTime(): TimeState { return { ...this.time } }
  
  /**
   * Main update loop
   */
  update(deltaTime: number): void {
    // Update time progression
    if (!this.time.paused) {
      this.time.hour += (deltaTime * this.time.speed) / 3600 // Convert to hours
      if (this.time.hour >= 24) {
        this.time.hour = 0
        this.time.day++
        if (this.time.day > 365) {
          this.time.day = 1
          this.time.year++
        }
      }
    }
    
    // Update particle systems
    this.updateParticles(deltaTime)
    
    // Update clouds
    this.updateClouds(deltaTime)
    
    // Update environment periodically (every few frames for performance)
    if (Math.floor(this.particleTime * 10) !== Math.floor((this.particleTime - deltaTime) * 10)) {
      this.updateEnvironment()
    }
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    // Remove all particle systems
    const particleSystems = [
      this.rainSystem,
      this.snowSystem,
      this.windParticles,
      this.springParticles,
      this.summerParticles,
      this.autumnParticles
    ]
    
    particleSystems.forEach(system => {
      if (system) {
        this.context.scene.remove(system)
        system.geometry.dispose()
        if (system.material instanceof THREE.Material) {
          system.material.dispose()
        }
      }
    })
    
    // Remove other objects
    if (this.skybox) {
      this.context.scene.remove(this.skybox)
      this.skybox.geometry.dispose()
      if (this.skybox.material instanceof THREE.Material) {
        this.skybox.material.dispose()
      }
    }
    
    if (this.clouds) {
      this.context.scene.remove(this.clouds)
      this.clouds.children.forEach(cloud => {
        if (cloud instanceof THREE.Mesh) {
          cloud.geometry.dispose()
          if (cloud.material instanceof THREE.Material) {
            cloud.material.dispose()
          }
        }
      })
    }
    
    if (this.moon) {
      this.context.scene.remove(this.moon)
      this.moon.geometry.dispose()
      if (this.moon.material instanceof THREE.Material) {
        this.moon.material.dispose()
      }
    }
    
    if (this.winterEffects) {
      this.context.scene.remove(this.winterEffects)
    }
    
    console.log('🧹 EnvironmentSystem disposed')
  }
}