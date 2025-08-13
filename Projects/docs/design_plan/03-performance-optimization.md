# ⚡ Performance & Optimization

## 📊 Current Performance Analysis

### 🔍 Performance Bottlenecks
현재 프로젝트에서 확인된 주요 성능 이슈들:

1. **Monolithic Environment System**: `environment.js` (2099 lines) - 단일 파일에서 모든 환경 효과 처리
2. **Global State Management**: 전역 변수로 상태 관리하여 메모리 누수 가능성
3. **Inefficient Particle Systems**: 매 프레임 파티클 생성/제거
4. **No LOD System**: 거리에 따른 레벨 오브 디테일 부재
5. **Memory Leaks**: 이벤트 리스너 및 Three.js 객체 정리 부족

### 📈 Performance Metrics
```javascript
// Current Performance Baseline
const performanceMetrics = {
  fps: '45-55',           // Target: 60fps
  frameTime: '18-22ms',   // Target: <16.67ms
  memoryUsage: 'High',    // Target: Stable
  drawCalls: '150-200',   // Target: <100
  triangles: '50K-100K'   // Target: <25K
};
```

## 🎯 Performance Targets

### 🚀 Target Metrics
```javascript
const targetMetrics = {
  fps: 60,                    // Consistent 60fps
  frameTime: '<16.67ms',     // Smooth rendering
  memoryUsage: 'Stable',     // No memory leaks
  drawCalls: '<100',         // Optimized rendering
  triangles: '<25K',         // Efficient geometry
  loadTime: '<3s',           // Fast initial load
  bundleSize: '<2MB'         // Optimized assets
};
```

## 🔧 Rendering Optimization

### 🎮 Three.js Performance Best Practices

#### 1. **Frustum Culling & Occlusion**
```javascript
class FrustumCullingSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.frustum = new THREE.Frustum();
    this.projectionMatrix = new THREE.Matrix4();
    this.matrix = new THREE.Matrix4();
  }
  
  update() {
    this.projectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix, 
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projectionMatrix);
    
    // Only render visible objects
    this.scene.traverse((object) => {
      if (object.isMesh && object.geometry) {
        const visible = this.frustum.intersectsBox(
          object.geometry.boundingBox
        );
        object.visible = visible;
      }
    });
  }
}
```

#### 2. **Geometry Instancing**
```javascript
class InstancedRenderer {
  constructor(geometry, material, count) {
    this.geometry = geometry;
    this.material = material;
    this.count = count;
    
    // Create instanced mesh
    this.mesh = new THREE.InstancedMesh(
      this.geometry, 
      this.material, 
      this.count
    );
    
    // Set up instance matrices
    this.matrix = new THREE.Matrix4();
    this.setupInstances();
  }
  
  setupInstances() {
    for (let i = 0; i < this.count; i++) {
      this.matrix.setPosition(
        Math.random() * 100 - 50,
        0,
        Math.random() * 100 - 50
      );
      this.mesh.setMatrixAt(i, this.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  
  update(deltaTime) {
    // Animate instances efficiently
    for (let i = 0; i < this.count; i++) {
      this.mesh.getMatrixAt(i, this.matrix);
      this.matrix.multiply(
        new THREE.Matrix4().makeRotationY(deltaTime * 0.5)
      );
      this.mesh.setMatrixAt(i, this.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
```

#### 3. **LOD (Level of Detail) System**
```javascript
class LODSystem {
  constructor() {
    this.lodLevels = new Map();
    this.camera = null;
    this.scene = null;
  }
  
  addLODObject(object, distances) {
    // distances: [near, medium, far]
    const lod = new THREE.LOD();
    
    distances.forEach((distance, index) => {
      const level = this.createLODLevel(object, index);
      lod.addLevel(level, distance);
    });
    
    this.lodLevels.set(object.id, lod);
    return lod;
  }
  
  createLODLevel(originalObject, level) {
    const geometry = originalObject.geometry.clone();
    
    switch (level) {
      case 0: // High detail
        return new THREE.Mesh(geometry, originalObject.material);
      case 1: // Medium detail
        geometry.mergeVertices();
        return new THREE.Mesh(geometry, originalObject.material);
      case 2: // Low detail
        geometry.mergeVertices();
        geometry.deleteAttribute('uv');
        geometry.deleteAttribute('normal');
        return new THREE.Mesh(geometry, originalObject.material);
    }
  }
  
  update(camera) {
    this.lodLevels.forEach((lod) => {
      lod.update(camera);
    });
  }
}
```

### 🎨 Material Optimization

#### 1. **Material Pooling**
```javascript
class MaterialPool {
  constructor() {
    this.materials = new Map();
    this.usageCount = new Map();
  }
  
  getMaterial(type, properties) {
    const key = this.createKey(type, properties);
    
    if (!this.materials.has(key)) {
      this.materials.set(key, this.createMaterial(type, properties));
      this.usageCount.set(key, 0);
    }
    
    this.usageCount.set(key, this.usageCount.get(key) + 1);
    return this.materials.get(key);
  }
  
  releaseMaterial(material) {
    const key = this.findMaterialKey(material);
    if (key) {
      const count = this.usageCount.get(key) - 1;
      this.usageCount.set(key, count);
      
      if (count <= 0) {
        this.materials.delete(key);
        this.usageCount.delete(key);
      }
    }
  }
  
  createMaterial(type, properties) {
    switch (type) {
      case 'basic':
        return new THREE.MeshBasicMaterial(properties);
      case 'phong':
        return new THREE.MeshPhongMaterial(properties);
      case 'lambert':
        return new THREE.MeshLambertMaterial(properties);
      default:
        return new THREE.MeshBasicMaterial(properties);
    }
  }
}
```

#### 2. **Texture Atlasing**
```javascript
class TextureAtlas {
  constructor(size = 2048) {
    this.size = size;
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
    this.textures = new Map();
    this.regions = new Map();
  }
  
  addTexture(name, image) {
    const region = this.findFreeRegion(image.width, image.height);
    if (region) {
      this.ctx.drawImage(image, region.x, region.y);
      this.textures.set(name, region);
      return region;
    }
    return null;
  }
  
  findFreeRegion(width, height) {
    // Simple region allocation algorithm
    // In production, use more sophisticated algorithms
    let x = 0, y = 0;
    let rowHeight = 0;
    
    for (const [name, region] of this.regions) {
      if (x + width <= this.size && y + height <= this.size) {
        return { x, y, width, height };
      }
      
      x += region.width;
      rowHeight = Math.max(rowHeight, region.height);
      
      if (x + width > this.size) {
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }
    }
    
    return { x, y, width, height };
  }
  
  getTextureCoordinates(name) {
    const region = this.textures.get(name);
    if (!region) return null;
    
    return {
      x: region.x / this.size,
      y: region.y / this.size,
      width: region.width / this.size,
      height: region.height / this.size
    };
  }
}
```

## 💾 Memory Management

### 🗑️ Object Pooling System
```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = new Set();
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  get() {
    let object;
    
    if (this.pool.length > 0) {
      object = this.pool.pop();
    } else {
      object = this.createFn();
    }
    
    this.active.add(object);
    return object;
  }
  
  release(object) {
    if (this.active.has(object)) {
      this.resetFn(object);
      this.active.delete(object);
      this.pool.push(object);
    }
  }
  
  releaseAll() {
    this.active.forEach(object => {
      this.release(object);
    });
  }
  
  getActiveCount() {
    return this.active.size;
  }
  
  getPoolSize() {
    return this.pool.length;
  }
}

// Usage Example: Particle Pool
const particlePool = new ObjectPool(
  () => new THREE.Vector3(),
  (vector) => vector.set(0, 0, 0),
  1000
);
```

### 🔄 Memory Leak Prevention
```javascript
class MemoryManager {
  constructor() {
    this.disposables = new Set();
    this.eventListeners = new Map();
  }
  
  trackDisposable(object) {
    this.disposables.add(object);
    return object;
  }
  
  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler });
  }
  
  dispose() {
    // Dispose Three.js objects
    this.disposables.forEach(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
      if (object.texture) object.texture.dispose();
    });
    
    // Remove event listeners
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    
    this.disposables.clear();
    this.eventListeners.clear();
  }
}
```

## ⚡ Update Loop Optimization

### 🎯 Smart Update System
```javascript
class SmartUpdateSystem {
  constructor() {
    this.systems = new Map();
    this.updatePriorities = new Map();
    this.frameCount = 0;
  }
  
  registerSystem(name, system, priority = 0, updateFrequency = 1) {
    this.systems.set(name, {
      system,
      priority,
      updateFrequency,
      lastUpdate: 0,
      updateCount: 0
    });
  }
  
  update(deltaTime, currentTime) {
    this.frameCount++;
    
    // Sort systems by priority
    const sortedSystems = Array.from(this.systems.entries())
      .sort(([, a], [, b]) => a.priority - b.priority);
    
    sortedSystems.forEach(([name, systemData]) => {
      const { system, updateFrequency, lastUpdate } = systemData;
      
      // Check if system should update this frame
      if (this.frameCount % updateFrequency === 0) {
        const systemDeltaTime = (currentTime - lastUpdate) / 1000;
        
        if (system.update) {
          system.update(systemDeltaTime);
          systemData.lastUpdate = currentTime;
          systemData.updateCount++;
        }
      }
    });
  }
  
  getSystemStats() {
    const stats = {};
    this.systems.forEach((systemData, name) => {
      stats[name] = {
        priority: systemData.priority,
        updateFrequency: systemData.updateFrequency,
        updateCount: systemData.updateCount
      };
    });
    return stats;
  }
}
```

### 🎮 Frame Rate Management
```javascript
class FrameRateManager {
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fpsHistory = [];
    this.maxHistorySize = 60;
  }
  
  shouldUpdate(currentTime) {
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime >= this.targetFrameTime) {
      this.lastFrameTime = currentTime;
      this.updateFPS(deltaTime);
      return true;
    }
    
    return false;
  }
  
  updateFPS(frameTime) {
    this.frameCount++;
    this.fpsHistory.push(1000 / frameTime);
    
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }
  }
  
  getCurrentFPS() {
    if (this.fpsHistory.length === 0) return 0;
    
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }
  
  getFrameTimeStats() {
    if (this.fpsHistory.length === 0) return null;
    
    const frameTimes = this.fpsHistory.map(fps => 1000 / fps);
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const min = Math.min(...frameTimes);
    const max = Math.max(...frameTimes);
    
    return { avg, min, max, current: this.fpsHistory[this.fpsHistory.length - 1] };
  }
}
```

## 📊 Performance Monitoring

### 📈 Real-time Performance Dashboard
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0
    };
    
    this.history = [];
    this.maxHistorySize = 300; // 5 minutes at 60fps
    
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    // Monitor frame rate
    let lastTime = performance.now();
    const measureFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      this.metrics.frameTime = deltaTime;
      this.metrics.fps = 1000 / deltaTime;
      
      lastTime = currentTime;
      this.updateHistory();
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
    
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
      }, 1000);
    }
  }
  
  updateHistory() {
    this.history.push({ ...this.metrics, timestamp: Date.now() });
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }
  
  getPerformanceReport() {
    const recent = this.history.slice(-60); // Last 60 frames
    
    return {
      current: { ...this.metrics },
      average: {
        fps: recent.reduce((sum, m) => sum + m.fps, 0) / recent.length,
        frameTime: recent.reduce((sum, m) => sum + m.frameTime, 0) / recent.length
      },
      min: {
        fps: Math.min(...recent.map(m => m.fps)),
        frameTime: Math.max(...recent.map(m => m.frameTime))
      },
      max: {
        fps: Math.max(...recent.map(m => m.fps)),
        frameTime: Math.min(...recent.map(m => m.frameTime))
      }
    };
  }
  
  detectPerformanceIssues() {
    const report = this.getPerformanceReport();
    const issues = [];
    
    if (report.average.fps < 55) {
      issues.push({
        type: 'low_fps',
        severity: 'high',
        message: `Average FPS is ${report.average.fps.toFixed(1)}, target is 60`
      });
    }
    
    if (report.average.frameTime > 18) {
      issues.push({
        type: 'high_frame_time',
        severity: 'medium',
        message: `Average frame time is ${report.average.frameTime.toFixed(2)}ms`
      });
    }
    
    return issues;
  }
}
```

## 🚀 Asset Optimization

### 📦 Asset Loading Strategy
```javascript
class AssetLoader {
  constructor() {
    this.loadingQueue = [];
    this.loadedAssets = new Map();
    this.loadingPromises = new Map();
    this.maxConcurrent = 3;
    this.currentLoading = 0;
  }
  
  async loadAsset(type, url, options = {}) {
    // Check if already loaded
    if (this.loadedAssets.has(url)) {
      return this.loadedAssets.get(url);
    }
    
    // Check if currently loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }
    
    // Add to queue if at capacity
    if (this.currentLoading >= this.maxConcurrent) {
      await this.waitForSlot();
    }
    
    // Load asset
    this.currentLoading++;
    const loadPromise = this.loadAssetInternal(type, url, options);
    
    this.loadingPromises.set(url, loadPromise);
    
    try {
      const asset = await loadPromise;
      this.loadedAssets.set(url, asset);
      this.loadingPromises.delete(url);
      this.currentLoading--;
      return asset;
    } catch (error) {
      this.loadingPromises.delete(url);
      this.currentLoading--;
      throw error;
    }
  }
  
  async loadAssetInternal(type, url, options) {
    switch (type) {
      case 'texture':
        return new Promise((resolve, reject) => {
          new THREE.TextureLoader().load(url, resolve, undefined, reject);
        });
      case 'model':
        return new Promise((resolve, reject) => {
          new THREE.GLTFLoader().load(url, resolve, undefined, reject);
        });
      case 'audio':
        return new Promise((resolve, reject) => {
          new THREE.AudioLoader().load(url, resolve, undefined, reject);
        });
      default:
        throw new Error(`Unsupported asset type: ${type}`);
    }
  }
  
  async waitForSlot() {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (this.currentLoading < this.maxConcurrent) {
          resolve();
        } else {
          setTimeout(checkSlot, 16);
        }
      };
      checkSlot();
    });
  }
  
  preloadAssets(assetList) {
    return Promise.all(
      assetList.map(({ type, url, options }) => 
        this.loadAsset(type, url, options)
      )
    );
  }
}
```

## 🎯 Implementation Roadmap

### 📋 Phase 1: Foundation (Week 1-2)
1. **Performance Monitoring** 시스템 구축
2. **Object Pooling** 기본 구조 구현
3. **Material Pooling** 시스템 구현
4. **Basic LOD** 시스템 구현

### 📋 Phase 2: Core Optimization (Week 3-4)
1. **Frustum Culling** 시스템 구현
2. **Geometry Instancing** 적용
3. **Smart Update System** 구현
4. **Memory Management** 강화

### 📋 Phase 3: Advanced Optimization (Week 5-6)
1. **Texture Atlasing** 시스템 구현
2. **Asset Loading** 최적화
3. **Performance Dashboard** 완성
4. **Stress Testing** 및 최적화

---

**Next**: [Development & Testing](./04-development-testing.md)
