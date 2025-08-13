# 🏗️ Architecture & System Design

## 📊 Current Architecture Analysis

### 🔍 Existing Structure
현재 프로젝트는 모듈화된 구조를 가지고 있지만, 몇 가지 개선점이 있습니다:

```
Current Architecture:
├── main.js (Entry Point)
├── core/
│   ├── app.js (Game Loop)
│   ├── sceneManager.js (Three.js Setup)
│   ├── eventBus.js (Event System)
│   └── updateBus.js (Update System)
├── systems/
│   ├── environment/
│   │   ├── SkySystem.js
│   │   └── WeatherSystem.js
│   └── placement/
│       └── PlacementSystem.js
├── environment.js (Monolithic Environment Logic)
├── gridModels.js (Model Loading & Management)
├── buttonInteract.js (UI Interactions)
└── UIManager.js (UI State Management)
```

### ⚠️ Current Issues
1. **Monolithic Files**: `environment.js` (2099 lines), `gridModels.js` (641 lines)
2. **Tight Coupling**: 시스템 간 직접적인 의존성
3. **Global State**: 전역 변수로 상태 관리
4. **Mixed Responsibilities**: 단일 파일에 여러 책임

## 🎯 Target Architecture

### 🏛️ Layered Architecture
```
┌─────────────────────────────────────┐
│           Presentation Layer        │ ← UI Components, Event Handlers
├─────────────────────────────────────┤
│            Business Layer           │ ← Game Logic, State Management
├─────────────────────────────────────┤
│           Service Layer             │ ← External APIs, File I/O
├─────────────────────────────────────┤
│           Data Layer                │ ← Models, Storage
└─────────────────────────────────────┘
```

### 🔧 Improved System Structure
```
src/
├── core/                           # 🏗️ Core Systems
│   ├── Engine.js                  # Main game engine
│   ├── SceneManager.js            # 3D scene management
│   ├── EventSystem.js             # Event bus & handlers
│   ├── UpdateSystem.js            # Update loop management
│   └── Config.js                  # Configuration management
├── systems/                        # ⚙️ Feature Systems
│   ├── Environment/
│   │   ├── WeatherSystem.js       # Weather simulation
│   │   ├── SeasonSystem.js        # Season management
│   │   ├── DayNightSystem.js      # Day/night cycle
│   │   └── ParticleSystem.js      # Particle effects
│   ├── World/
│   │   ├── TerrainSystem.js       # Terrain management
│   │   ├── ModelSystem.js         # 3D model loading
│   │   └── PlacementSystem.js     # Object placement
│   └── UI/
│       ├── UISystem.js            # UI state management
│       ├── ComponentSystem.js     # UI components
│       └── InputSystem.js         # Input handling
├── components/                     # 🧩 Reusable Components
│   ├── Button.js
│   ├── Slider.js
│   ├── Panel.js
│   └── Modal.js
├── utils/                          # 🛠️ Utility Functions
│   ├── MathUtils.js
│   ├── ColorUtils.js
│   ├── FileUtils.js
│   └── ValidationUtils.js
└── types/                          # 📝 Type Definitions
    ├── Environment.js
    ├── Models.js
    └── UI.js
```

## 🔄 System Communication

### 📡 Event-Driven Architecture
```javascript
// Event System Example
class EventSystem {
  constructor() {
    this.events = new Map();
  }
  
  emit(eventName, data) {
    const handlers = this.events.get(eventName) || [];
    handlers.forEach(handler => handler(data));
  }
  
  on(eventName, handler) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName).push(handler);
  }
}

// Usage
eventSystem.on('weather:changed', (weatherData) => {
  particleSystem.updateWeather(weatherData);
  uiSystem.updateWeatherDisplay(weatherData);
});
```

### 🔗 Dependency Injection
```javascript
// System Registration
class Engine {
  constructor() {
    this.systems = new Map();
    this.eventSystem = new EventSystem();
  }
  
  registerSystem(name, system) {
    system.setEngine(this);
    system.setEventSystem(this.eventSystem);
    this.systems.set(name, system);
  }
  
  getSystem(name) {
    return this.systems.get(name);
  }
}
```

## 🎮 Game Loop Architecture

### ⚡ Optimized Update Loop
```javascript
class UpdateSystem {
  constructor() {
    this.systems = [];
    this.lastTime = 0;
    this.fps = 60;
    this.frameTime = 1000 / this.fps;
  }
  
  addSystem(system) {
    this.systems.push(system);
  }
  
  update(currentTime) {
    const deltaTime = Math.min(currentTime - this.lastTime, 1000 / 30);
    
    // Fixed timestep for physics
    if (deltaTime >= this.frameTime) {
      this.lastTime = currentTime;
      
      // Update systems in priority order
      this.systems
        .sort((a, b) => a.priority - b.priority)
        .forEach(system => {
          if (system.shouldUpdate(deltaTime)) {
            system.update(deltaTime);
          }
        });
    }
    
    // Render at full refresh rate
    this.render();
  }
}
```

## 🗄️ State Management

### 📊 Centralized State Store
```javascript
class StateManager {
  constructor() {
    this.state = new Proxy({
      environment: {
        season: 'spring',
        weather: 'sunny',
        time: 'day',
        temperature: 20
      },
      world: {
        objects: new Map(),
        terrain: new Map()
      },
      ui: {
        activePanel: null,
        selectedObject: null
      }
    }, {
      set: (target, property, value) => {
        target[property] = value;
        this.notifyChange(property, value);
        return true;
      }
    });
  }
  
  notifyChange(property, value) {
    this.eventSystem.emit(`state:${property}:changed`, value);
  }
}
```

## 🔧 Configuration Management

### ⚙️ Environment-Based Config
```javascript
// config/
├── default.js                    # Default configuration
├── development.js                # Development overrides
├── production.js                 # Production overrides
└── index.js                      # Config loader

// Usage
import config from './config';
const maxParticles = config.environment.maxParticles;
const debugMode = config.debug.enabled;
```

## 🚀 Migration Strategy

### 📋 Phase 1: Foundation (Week 1-2)
1. **Create new directory structure**
2. **Extract core systems** from existing files
3. **Implement event system**
4. **Create basic state management**

### 📋 Phase 2: Core Systems (Week 3-4)
1. **Refactor environment.js** into separate systems
2. **Extract model management** from gridModels.js
3. **Implement dependency injection**
4. **Add configuration system**

### 📋 Phase 3: Integration (Week 5-6)
1. **Update existing code** to use new architecture
2. **Add error handling** and logging
3. **Implement performance monitoring**
4. **Write integration tests**

## 📊 Performance Considerations

### 🎯 System Update Optimization
- **Priority-based updates**: Critical systems update every frame
- **Conditional updates**: Non-critical systems update less frequently
- **Batch processing**: Group similar operations
- **LOD management**: Adjust detail based on performance

### 💾 Memory Management
- **Object pooling**: Reuse objects instead of creating/destroying
- **Texture atlasing**: Combine multiple textures
- **Geometry instancing**: Share geometry between similar objects
- **Garbage collection**: Minimize object creation in update loops

## 🔍 Monitoring & Debugging

### 📈 Performance Metrics
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0
    };
  }
  
  startFrame() {
    this.frameStart = performance.now();
  }
  
  endFrame() {
    const frameTime = performance.now() - this.frameStart;
    this.metrics.frameTime = frameTime;
    this.metrics.fps = 1000 / frameTime;
    
    // Log performance issues
    if (frameTime > 16.67) { // > 60fps
      console.warn(`Frame time exceeded 16.67ms: ${frameTime.toFixed(2)}ms`);
    }
  }
}
```

---

**Next**: [UI/UX Design System](./02-ui-ux-design-system.md)
