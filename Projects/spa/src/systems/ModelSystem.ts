/**
 * 🎯 Model System
 * GLTF model loading, caching, and instance management
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { ThreeJSContext } from '../core/ThreeJSCore'

export interface ModelData {
  id: string
  name: string
  category: string
  url: string
  fallbackUrl?: string
  scale?: THREE.Vector3
  position?: THREE.Vector3
  rotation?: THREE.Vector3
  animations?: string[]
  cost?: number
  rarity?: string
}

export interface ModelInstance {
  id: string
  modelId: string
  object: THREE.Group
  position: THREE.Vector3
  rotation: THREE.Vector3
  scale: THREE.Vector3
  animations?: THREE.AnimationMixer
  boundingBox?: THREE.Box3
  userData: Record<string, any>
}

export interface LoadedModel {
  data: ModelData
  scene: THREE.Group
  animations: THREE.AnimationClip[]
  mixer?: THREE.AnimationMixer
  instances: ModelInstance[]
}

export class ModelSystem {
  private context!: ThreeJSContext
  private loader!: GLTFLoader
  private dracoLoader!: DRACOLoader
  
  // Model cache and instances
  private loadedModels = new Map<string, LoadedModel>()
  private instances = new Map<string, ModelInstance>()
  private loadingPromises = new Map<string, Promise<LoadedModel>>()
  
  // Animation system
  private mixers: THREE.AnimationMixer[] = []
  
  // Performance tracking
  private loadStats = {
    totalLoaded: 0,
    totalFailed: 0,
    cacheHits: 0,
    memoryUsage: 0
  }
  
  /**
   * Initialize the model system
   */
  initialize(context: ThreeJSContext): void {
    this.context = context
    this.setupLoaders()
    this.preloadModels()
    
    console.log('✅ ModelSystem initialized')
  }
  
  /**
   * Setup GLTF and DRACO loaders
   */
  private setupLoaders(): void {
    // DRACO loader for compressed models
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/')
    
    // GLTF loader with DRACO support
    this.loader = new GLTFLoader()
    this.loader.setDRACOLoader(this.dracoLoader)
    
    // Loading manager for progress tracking
    const loadingManager = new THREE.LoadingManager()
    loadingManager.onLoad = () => {
      console.log('📦 All models loaded')
    }
    loadingManager.onProgress = (url, loaded, total) => {
      const progress = (loaded / total) * 100
      console.log(`📥 Loading progress: ${progress.toFixed(1)}% (${url})`)
    }
    loadingManager.onError = (url) => {
      console.error('❌ Failed to load:', url)
    }
    
    this.loader.manager = loadingManager
  }
  
  /**
   * Preload essential models
   */
  private async preloadModels(): Promise<void> {
    const essentialModels: ModelData[] = [
      {
        id: 'cow',
        name: 'Cow',
        category: 'animals',
        url: '/models/cow.glb',
        fallbackUrl: 'https://threejs.org/examples/models/gltf/Horse.glb',
        scale: new THREE.Vector3(1, 1, 1),
        animations: ['idle', 'walk', 'eat']
      },
      {
        id: 'tree',
        name: 'Oak Tree',
        category: 'nature',
        url: '/models/tree.glb',
        fallbackUrl: 'https://threejs.org/examples/models/gltf/Tree.glb',
        scale: new THREE.Vector3(2, 2, 2)
      },
      {
        id: 'barn',
        name: 'Barn',
        category: 'buildings',
        url: '/models/barn.glb',
        fallbackUrl: 'https://threejs.org/examples/models/gltf/House.glb',
        scale: new THREE.Vector3(3, 3, 3)
      },
      {
        id: 'windmill',
        name: 'Windmill',
        category: 'buildings',
        url: '/models/windmill.glb',
        fallbackUrl: 'https://threejs.org/examples/models/gltf/Fox.glb',
        scale: new THREE.Vector3(2, 2, 2),
        animations: ['rotate']
      }
    ]
    
    // Load essential models in parallel
    const loadPromises = essentialModels.map(model => this.loadModel(model))
    await Promise.allSettled(loadPromises)
  }
  
  /**
   * Load a GLTF model with caching and fallback
   */
  async loadModel(modelData: ModelData): Promise<LoadedModel> {
    // Check cache first
    if (this.loadedModels.has(modelData.id)) {
      this.loadStats.cacheHits++
      return this.loadedModels.get(modelData.id)!
    }
    
    // Check if already loading
    if (this.loadingPromises.has(modelData.id)) {
      return this.loadingPromises.get(modelData.id)!
    }
    
    // Start loading
    const loadPromise = this.loadModelInternal(modelData)
    this.loadingPromises.set(modelData.id, loadPromise)
    
    try {
      const loadedModel = await loadPromise
      this.loadedModels.set(modelData.id, loadedModel)
      this.loadStats.totalLoaded++
      return loadedModel
    } catch (error) {
      this.loadStats.totalFailed++
      throw error
    } finally {
      this.loadingPromises.delete(modelData.id)
    }
  }
  
  /**
   * Internal model loading with fallback
   */
  private async loadModelInternal(modelData: ModelData): Promise<LoadedModel> {
    try {
      // Try primary URL
      const gltf = await this.loadGLTF(modelData.url)
      return this.processLoadedModel(modelData, gltf)
    } catch (primaryError) {
      console.warn(`Failed to load ${modelData.url}, trying fallback...`)
      
      if (modelData.fallbackUrl) {
        try {
          // Try fallback URL
          const gltf = await this.loadGLTF(modelData.fallbackUrl)
          return this.processLoadedModel(modelData, gltf)
        } catch (fallbackError) {
          console.error(`Both primary and fallback failed for ${modelData.id}`)
          throw fallbackError
        }
      } else {
        throw primaryError
      }
    }
  }
  
  /**
   * Load GLTF file
   */
  private loadGLTF(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          // Progress callback
        },
        (error) => reject(error)
      )
    })
  }
  
  /**
   * Process loaded GLTF model
   */
  private processLoadedModel(modelData: ModelData, gltf: any): LoadedModel {
    const scene = gltf.scene.clone()
    
    // Apply transformations
    if (modelData.scale) {
      scene.scale.copy(modelData.scale)
    }
    if (modelData.position) {
      scene.position.copy(modelData.position)
    }
    if (modelData.rotation) {
      scene.rotation.setFromVector3(modelData.rotation)
    }
    
    // Setup shadows
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Optimize materials
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.envMapIntensity = 0.8
        }
      }
    })
    
    // Setup animations
    let mixer: THREE.AnimationMixer | undefined
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(scene)
      this.mixers.push(mixer)
      
      // Auto-play first animation if available
      const firstClip = gltf.animations[0]
      if (firstClip) {
        const action = mixer.clipAction(firstClip)
        action.play()
      }
    }
    
    return {
      data: modelData,
      scene,
      animations: gltf.animations || [],
      mixer,
      instances: []
    }
  }
  
  /**
   * Create an instance of a loaded model
   */
  async createInstance(modelId: string, position?: THREE.Vector3, rotation?: THREE.Vector3): Promise<ModelInstance> {
    const loadedModel = this.loadedModels.get(modelId)
    if (!loadedModel) {
      throw new Error(`Model ${modelId} not loaded`)
    }
    
    // Clone the model
    const object = loadedModel.scene.clone()
    const instanceId = `${modelId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Set position and rotation
    if (position) {
      object.position.copy(position)
    }
    if (rotation) {
      object.rotation.setFromVector3(rotation)
    }
    
    // Setup animations for instance
    let animations: THREE.AnimationMixer | undefined
    if (loadedModel.animations.length > 0) {
      animations = new THREE.AnimationMixer(object)
      this.mixers.push(animations)
      
      // Copy animations from original
      loadedModel.animations.forEach(clip => {
        const action = animations!.clipAction(clip.clone())
        if (loadedModel.mixer) {
          // Match the original's animation state
          action.play()
        }
      })
    }
    
    // Calculate bounding box
    const boundingBox = new THREE.Box3().setFromObject(object)
    
    // Create instance
    const instance: ModelInstance = {
      id: instanceId,
      modelId,
      object,
      position: object.position.clone(),
      rotation: object.rotation.toVector3(),
      scale: object.scale.clone(),
      animations,
      boundingBox,
      userData: {}
    }
    
    // Add to scene and tracking
    this.context.scene.add(object)
    this.instances.set(instanceId, instance)
    loadedModel.instances.push(instance)
    
    console.log(`📦 Created instance: ${instanceId} (${modelId})`)
    return instance
  }
  
  /**
   * Remove an instance
   */
  removeInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      return false
    }
    
    // Remove from scene
    this.context.scene.remove(instance.object)
    
    // Cleanup animations
    if (instance.animations) {
      const mixerIndex = this.mixers.indexOf(instance.animations)
      if (mixerIndex > -1) {
        this.mixers.splice(mixerIndex, 1)
      }
      instance.animations.stopAllAction()
    }
    
    // Remove from tracking
    this.instances.delete(instanceId)
    
    // Remove from loaded model instances
    const loadedModel = this.loadedModels.get(instance.modelId)
    if (loadedModel) {
      const instanceIndex = loadedModel.instances.findIndex(i => i.id === instanceId)
      if (instanceIndex > -1) {
        loadedModel.instances.splice(instanceIndex, 1)
      }
    }
    
    console.log(`🗑️ Removed instance: ${instanceId}`)
    return true
  }
  
  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): ModelInstance | undefined {
    return this.instances.get(instanceId)
  }
  
  /**
   * Get all instances of a model
   */
  getModelInstances(modelId: string): ModelInstance[] {
    const loadedModel = this.loadedModels.get(modelId)
    return loadedModel ? [...loadedModel.instances] : []
  }
  
  /**
   * Get all instances
   */
  getAllInstances(): ModelInstance[] {
    return Array.from(this.instances.values())
  }
  
  /**
   * Add model at screen position (for drag & drop)
   */
  async addModelAtScreenPosition(modelData: ModelData, screenX: number, screenY: number): Promise<ModelInstance | null> {
    // Convert screen coordinates to world position
    const mouse = new THREE.Vector2(
      (screenX / this.context.renderer.domElement.clientWidth) * 2 - 1,
      -(screenY / this.context.renderer.domElement.clientHeight) * 2 + 1
    )
    
    // Raycast to ground plane
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, this.context.camera)
    
    // Create ground plane for intersection
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersection = new THREE.Vector3()
    raycaster.ray.intersectPlane(groundPlane, intersection)
    
    if (intersection) {
      // Ensure model is loaded
      await this.loadModel(modelData)
      
      // Create instance at intersection point
      return this.createInstance(modelData.id, intersection)
    }
    
    return null
  }
  
  /**
   * Update animation mixers
   */
  update(deltaTime: number): void {
    // Update all animation mixers
    this.mixers.forEach(mixer => {
      mixer.update(deltaTime)
    })
    
    // Update instance positions (for physics, etc.)
    this.instances.forEach(instance => {
      instance.position.copy(instance.object.position)
      instance.rotation = instance.object.rotation.toVector3()
      instance.scale.copy(instance.object.scale)
    })
  }
  
  /**
   * Export scene data
   */
  exportScene(): any {
    const sceneData = {
      instances: Array.from(this.instances.values()).map(instance => ({
        id: instance.id,
        modelId: instance.modelId,
        position: instance.position.toArray(),
        rotation: instance.rotation.toArray(),
        scale: instance.scale.toArray(),
        userData: instance.userData
      })),
      timestamp: Date.now()
    }
    
    return sceneData
  }
  
  /**
   * Import scene data
   */
  async importScene(sceneData: any): Promise<void> {
    // Clear existing instances
    this.clearScene()
    
    // Recreate instances
    for (const instanceData of sceneData.instances) {
      try {
        const position = new THREE.Vector3().fromArray(instanceData.position)
        const rotation = new THREE.Vector3().fromArray(instanceData.rotation)
        const scale = new THREE.Vector3().fromArray(instanceData.scale)
        
        const instance = await this.createInstance(instanceData.modelId, position, rotation)
        instance.object.scale.copy(scale)
        instance.userData = instanceData.userData || {}
      } catch (error) {
        console.warn(`Failed to recreate instance ${instanceData.id}:`, error)
      }
    }
    
    console.log(`📥 Imported ${sceneData.instances.length} instances`)
  }
  
  /**
   * Clear all instances
   */
  clearScene(): void {
    // Remove all instances
    const instanceIds = Array.from(this.instances.keys())
    instanceIds.forEach(id => this.removeInstance(id))
    
    console.log('🧹 Scene cleared')
  }
  
  /**
   * Get loading statistics
   */
  getStats(): any {
    return {
      ...this.loadStats,
      modelsLoaded: this.loadedModels.size,
      instancesActive: this.instances.size,
      mixersActive: this.mixers.length
    }
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    // Stop all animations
    this.mixers.forEach(mixer => {
      mixer.stopAllAction()
    })
    this.mixers.length = 0
    
    // Clear all instances
    this.clearScene()
    
    // Dispose loaded models
    this.loadedModels.forEach(model => {
      model.scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    })
    this.loadedModels.clear()
    
    // Dispose loaders
    this.dracoLoader.dispose()
    
    console.log('🧹 ModelSystem disposed')
  }
}