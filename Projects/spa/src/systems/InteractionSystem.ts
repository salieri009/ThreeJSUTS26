/**
 * 🎯 Interaction System
 * Handle user interactions with 3D scene objects
 */

import * as THREE from 'three'
import { ThreeJSContext } from '../core/ThreeJSCore'

export class InteractionSystem extends THREE.EventDispatcher {
  private context!: ThreeJSContext
  private isEnabled = true
  
  // Selection state
  private selectedObjects = new Set<THREE.Object3D>()
  private hoveredObject: THREE.Object3D | null = null
  
  // Interaction state
  private isDragging = false
  private dragStartPosition = new THREE.Vector2()
  private dragCurrentPosition = new THREE.Vector2()
  private dragThreshold = 5 // pixels
  
  // Ground plane for object placement
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  
  // Visual helpers
  private selectionHelper?: THREE.BoxHelper
  private gridHelper?: THREE.GridHelper
  
  // Interaction modes
  private currentMode: 'select' | 'place' | 'move' | 'rotate' | 'scale' = 'select'
  private placementPreview?: THREE.Object3D
  
  /**
   * Initialize interaction system
   */
  initialize(context: ThreeJSContext): void {
    this.context = context
    this.setupHelpers()
    this.setupEventListeners()
    
    console.log('✅ InteractionSystem initialized')
  }
  
  /**
   * Setup visual helpers
   */
  private setupHelpers(): void {
    // Selection helper (box outline)
    this.selectionHelper = new THREE.BoxHelper(new THREE.Object3D(), 0x00ff00)
    this.selectionHelper.visible = false
    this.context.scene.add(this.selectionHelper)
    
    // Grid helper for snapping
    this.gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0xcccccc)
    this.gridHelper.position.y = 0.01
    this.gridHelper.visible = false
    this.context.scene.add(this.gridHelper)
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    const canvas = this.context.renderer.domElement
    
    // Mouse events
    canvas.addEventListener('click', this.handleClick.bind(this))
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    canvas.addEventListener('wheel', this.handleWheel.bind(this))
    canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this))
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this))
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))
  }
  
  /**
   * Handle mouse click
   */
  handleClick(event: MouseEvent): void {
    if (!this.isEnabled) return
    
    event.preventDefault()
    
    const intersections = this.getIntersections(event)
    const clickedObject = intersections.length > 0 ? intersections[0].object : null
    
    // Handle different interaction modes
    switch (this.currentMode) {
      case 'select':
        this.handleSelectClick(clickedObject, event)
        break
      case 'place':
        this.handlePlaceClick(event)
        break
      case 'move':
        this.handleMoveClick(clickedObject, event)
        break
    }
  }
  
  /**
   * Handle selection click
   */
  private handleSelectClick(object: THREE.Object3D | null, event: MouseEvent): void {
    if (object && this.isSelectableObject(object)) {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select
        if (this.selectedObjects.has(object)) {
          this.deselectObject(object)
        } else {
          this.selectObject(object, true)
        }
      } else {
        // Single select
        this.clearSelection()
        this.selectObject(object)
      }
    } else {
      // Click on empty space
      if (!event.ctrlKey && !event.metaKey) {
        this.clearSelection()
      }
    }
  }
  
  /**
   * Handle placement click
   */
  private handlePlaceClick(event: MouseEvent): void {
    const worldPosition = this.getWorldPositionFromMouse(event)
    if (worldPosition && this.placementPreview) {
      // Place object at clicked position
      const placedObject = this.placementPreview.clone()
      placedObject.position.copy(worldPosition)
      this.context.scene.add(placedObject)
      
      this.dispatchEvent({
        type: 'object-placed',
        object: placedObject,
        position: worldPosition
      })
      
      console.log('📍 Object placed at:', worldPosition)
    }
  }
  
  /**
   * Handle move click
   */
  private handleMoveClick(object: THREE.Object3D | null, event: MouseEvent): void {
    if (object && this.selectedObjects.has(object)) {
      const worldPosition = this.getWorldPositionFromMouse(event)
      if (worldPosition) {
        object.position.copy(worldPosition)
        this.updateSelectionHelper()
        
        this.dispatchEvent({
          type: 'object-moved',
          object,
          position: worldPosition
        })
      }
    }
  }
  
  /**
   * Handle mouse move
   */
  handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return
    
    this.updateMousePosition(event)
    
    if (this.isDragging) {
      this.handleDrag(event)
    } else {
      this.handleHover(event)
    }
    
    // Update placement preview
    if (this.currentMode === 'place' && this.placementPreview) {
      const worldPosition = this.getWorldPositionFromMouse(event)
      if (worldPosition) {
        this.placementPreview.position.copy(worldPosition)
      }
    }
  }
  
  /**
   * Handle hover
   */
  private handleHover(event: MouseEvent): void {
    const intersections = this.getIntersections(event)
    const hoveredObject = intersections.length > 0 ? intersections[0].object : null
    
    if (hoveredObject !== this.hoveredObject) {
      // Hover out
      if (this.hoveredObject) {
        this.setObjectHover(this.hoveredObject, false)
        this.dispatchEvent({
          type: 'object-hover-out',
          object: this.hoveredObject
        })
      }
      
      // Hover in
      if (hoveredObject && this.isSelectableObject(hoveredObject)) {
        this.setObjectHover(hoveredObject, true)
        this.dispatchEvent({
          type: 'object-hover',
          object: hoveredObject
        })
      }
      
      this.hoveredObject = hoveredObject
    }
    
    // Update cursor
    this.updateCursor(hoveredObject)
  }
  
  /**
   * Handle drag
   */
  private handleDrag(event: MouseEvent): void {
    this.dragCurrentPosition.set(event.clientX, event.clientY)
    
    const dragDistance = this.dragStartPosition.distanceTo(this.dragCurrentPosition)
    
    if (dragDistance > this.dragThreshold) {
      this.dragSelectedObjects(event)
    }
  }
  
  /**
   * Handle mouse down
   */
  handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled) return
    
    this.isDragging = true
    this.dragStartPosition.set(event.clientX, event.clientY)
    this.dragCurrentPosition.copy(this.dragStartPosition)
  }
  
  /**
   * Handle mouse up
   */
  handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) return
    this.isDragging = false
  }
  
  /**
   * Handle mouse wheel
   */
  handleWheel(event: WheelEvent): void {
    // Wheel events are typically handled by camera controls
  }
  
  /**
   * Handle context menu
   */
  handleContextMenu(event: MouseEvent): void {
    event.preventDefault()
    
    const intersections = this.getIntersections(event)
    const rightClickedObject = intersections.length > 0 ? intersections[0].object : null
    
    this.dispatchEvent({
      type: 'context-menu',
      object: rightClickedObject,
      screenPosition: new THREE.Vector2(event.clientX, event.clientY)
    })
  }
  
  /**
   * Handle keyboard down
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return
    
    switch (event.code) {
      case 'Delete':
      case 'Backspace':
        this.deleteSelectedObjects()
        break
      case 'Escape':
        this.clearSelection()
        this.setMode('select')
        break
      case 'KeyG':
        if (!event.repeat) this.setMode('move')
        break
      case 'KeyR':
        if (!event.repeat) this.setMode('rotate')
        break
      case 'KeyS':
        if (!event.repeat) this.setMode('scale')
        break
      case 'KeyA':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          this.selectAllObjects()
        }
        break
    }
  }
  
  /**
   * Handle keyboard up
   */
  private handleKeyUp(event: KeyboardEvent): void {
    // Placeholder for key up events
  }
  
  /**
   * Touch event handlers for mobile
   */
  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      this.handleMouseDown(mouseEvent)
    }
  }
  
  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      this.handleMouseMove(mouseEvent)
    }
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    const mouseEvent = new MouseEvent('mouseup', {})
    this.handleMouseUp(mouseEvent)
    
    // Also trigger click for touch
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0]
      const clickEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      this.handleClick(clickEvent)
    }
  }
  
  /**
   * Get intersections from mouse position
   */
  private getIntersections(event: MouseEvent): THREE.Intersection[] {
    this.updateMousePosition(event)
    return this.context.raycaster.intersectObjects(this.context.scene.children, true)
  }
  
  /**
   * Update mouse position for raycaster
   */
  private updateMousePosition(event: MouseEvent): void {
    const rect = this.context.renderer.domElement.getBoundingClientRect()
    this.context.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.context.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.context.raycaster.setFromCamera(this.context.mouse, this.context.camera)
  }
  
  /**
   * Get world position from mouse coordinates
   */
  private getWorldPositionFromMouse(event: MouseEvent): THREE.Vector3 | null {
    this.updateMousePosition(event)
    
    const intersection = new THREE.Vector3()
    const intersected = this.context.raycaster.ray.intersectPlane(this.groundPlane, intersection)
    
    return intersected ? intersection : null
  }
  
  /**
   * Check if object is selectable
   */
  private isSelectableObject(object: THREE.Object3D): boolean {
    // Skip helpers, lights, cameras, etc.
    if (object instanceof THREE.Light ||
        object instanceof THREE.Camera ||
        object instanceof THREE.GridHelper ||
        object instanceof THREE.BoxHelper ||
        object.name.includes('helper') ||
        object.userData.nonSelectable) {
      return false
    }
    
    return true
  }
  
  /**
   * Select object
   */
  private selectObject(object: THREE.Object3D, addToSelection = false): void {
    if (!addToSelection) {
      this.clearSelection()
    }
    
    this.selectedObjects.add(object)
    this.setObjectSelected(object, true)
    this.updateSelectionHelper()
    
    this.dispatchEvent({
      type: 'object-selected',
      object
    })
  }
  
  /**
   * Deselect object
   */
  private deselectObject(object: THREE.Object3D): void {
    this.selectedObjects.delete(object)
    this.setObjectSelected(object, false)
    this.updateSelectionHelper()
    
    this.dispatchEvent({
      type: 'object-deselected',
      object
    })
  }
  
  /**
   * Clear all selections
   */
  private clearSelection(): void {
    this.selectedObjects.forEach(object => {
      this.setObjectSelected(object, false)
    })
    this.selectedObjects.clear()
    
    if (this.selectionHelper) {
      this.selectionHelper.visible = false
    }
    
    this.dispatchEvent({ type: 'selection-cleared' })
  }
  
  /**
   * Select all selectable objects
   */
  private selectAllObjects(): void {
    this.context.scene.traverse(object => {
      if (this.isSelectableObject(object)) {
        this.selectObject(object, true)
      }
    })
  }
  
  /**
   * Delete selected objects
   */
  private deleteSelectedObjects(): void {
    const objectsToDelete = Array.from(this.selectedObjects)
    
    objectsToDelete.forEach(object => {
      this.context.scene.remove(object)
      this.selectedObjects.delete(object)
      
      this.dispatchEvent({
        type: 'object-removed',
        object
      })
    })
    
    this.updateSelectionHelper()
    console.log(`🗑️ Deleted ${objectsToDelete.length} objects`)
  }
  
  /**
   * Set object visual state (selected)
   */
  private setObjectSelected(object: THREE.Object3D, selected: boolean): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (selected) {
          child.userData.originalMaterial = child.material
          child.material = child.material.clone()
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive.setHex(0x444444)
          }
        } else if (child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial
          delete child.userData.originalMaterial
        }
      }
    })
  }
  
  /**
   * Set object visual state (hovered)
   */
  private setObjectHover(object: THREE.Object3D, hovered: boolean): void {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (hovered && !this.selectedObjects.has(object)) {
          child.userData.originalMaterial = child.material
          child.material = child.material.clone()
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive.setHex(0x222222)
          }
        } else if (!hovered && child.userData.originalMaterial && !this.selectedObjects.has(object)) {
          child.material = child.userData.originalMaterial
          delete child.userData.originalMaterial
        }
      }
    })
  }
  
  /**
   * Update selection helper box
   */
  private updateSelectionHelper(): void {
    if (!this.selectionHelper) return
    
    if (this.selectedObjects.size === 1) {
      const selectedObject = Array.from(this.selectedObjects)[0]
      this.selectionHelper.setFromObject(selectedObject)
      this.selectionHelper.visible = true
    } else {
      this.selectionHelper.visible = false
    }
  }
  
  /**
   * Update cursor based on interaction state
   */
  private updateCursor(hoveredObject: THREE.Object3D | null): void {
    const canvas = this.context.renderer.domElement
    
    switch (this.currentMode) {
      case 'select':
        canvas.style.cursor = hoveredObject ? 'pointer' : 'default'
        break
      case 'place':
        canvas.style.cursor = 'crosshair'
        break
      case 'move':
        canvas.style.cursor = 'move'
        break
      case 'rotate':
        canvas.style.cursor = 'grab'
        break
      case 'scale':
        canvas.style.cursor = 'nw-resize'
        break
    }
  }
  
  /**
   * Drag selected objects
   */
  private dragSelectedObjects(event: MouseEvent): void {
    const worldPosition = this.getWorldPositionFromMouse(event)
    if (!worldPosition) return
    
    // Move all selected objects (simplified)
    this.selectedObjects.forEach(object => {
      const deltaX = this.dragCurrentPosition.x - this.dragStartPosition.x
      const deltaY = this.dragCurrentPosition.y - this.dragStartPosition.y
      
      // Convert screen delta to world delta (simplified)
      object.position.x += deltaX * 0.01
      object.position.z += deltaY * 0.01
    })
    
    this.updateSelectionHelper()
  }
  
  /**
   * Set interaction mode
   */
  setMode(mode: 'select' | 'place' | 'move' | 'rotate' | 'scale'): void {
    this.currentMode = mode
    
    // Update visual feedback
    this.gridHelper!.visible = mode === 'place'
    
    console.log(`🎯 Interaction mode: ${mode}`)
    
    this.dispatchEvent({
      type: 'mode-changed',
      mode
    })
  }
  
  /**
   * Set placement preview object
   */
  setPlacementPreview(object: THREE.Object3D | null): void {
    if (this.placementPreview) {
      this.context.scene.remove(this.placementPreview)
    }
    
    if (object) {
      this.placementPreview = object.clone()
      this.placementPreview.userData.isPreview = true
      
      // Make preview semi-transparent
      this.placementPreview.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = 0.5
        }
      })
      
      this.context.scene.add(this.placementPreview)
    } else {
      this.placementPreview = undefined
    }
  }
  
  /**
   * Get selected objects
   */
  getSelectedObjects(): THREE.Object3D[] {
    return Array.from(this.selectedObjects)
  }
  
  /**
   * Get current interaction mode
   */
  getCurrentMode(): string {
    return this.currentMode
  }
  
  /**
   * Enable/disable interactions
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    
    if (!enabled) {
      this.clearSelection()
      this.setPlacementPreview(null)
    }
  }
  
  /**
   * Update interaction system
   */
  update(deltaTime: number): void {
    // Update any time-based interactions
    if (this.selectionHelper && this.selectionHelper.visible) {
      // Subtle pulsing animation for selection
      const time = Date.now() * 0.001
      this.selectionHelper.material.opacity = 0.5 + Math.sin(time * 3) * 0.2
    }
  }
  
  /**
   * Dispose interaction system
   */
  dispose(): void {
    // Remove event listeners
    const canvas = this.context.renderer.domElement
    
    canvas.removeEventListener('click', this.handleClick.bind(this))
    canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    canvas.removeEventListener('wheel', this.handleWheel.bind(this))
    canvas.removeEventListener('contextmenu', this.handleContextMenu.bind(this))
    
    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    
    canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    
    // Clear selections
    this.clearSelection()
    
    // Remove helpers
    if (this.selectionHelper) {
      this.context.scene.remove(this.selectionHelper)
    }
    if (this.gridHelper) {
      this.context.scene.remove(this.gridHelper)
    }
    if (this.placementPreview) {
      this.context.scene.remove(this.placementPreview)
    }
    
    console.log('🧹 InteractionSystem disposed')
  }
}