# 🧪 Development & Testing

## 🛠️ Development Environment Setup

### 📦 Package Management
```json
{
  "name": "animal-simulator",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint src --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write src",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

### ⚙️ Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'Projects',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'Projects/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['three']
  }
});
```

## 🧪 Testing Strategy

### 📋 Testing Pyramid
```
        /\
       /  \     E2E Tests (Few, Slow)
      /____\    
     /      \   Integration Tests (Some, Medium)
    /________\  
   /          \  Unit Tests (Many, Fast)
  /____________\
```

### 🧩 Unit Testing with Jest

#### Component Testing
```javascript
// tests/components/Button.test.js
import { render, fireEvent, screen } from '@testing-library/dom';
import { Button } from '../../src/components/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render('<ui-button>Click me</ui-button>');
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render('<ui-button onclick="handleClick()">Click me</ui-button>');
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies variant classes correctly', () => {
    render('<ui-button variant="primary">Button</ui-button>');
    const button = screen.getByText('Button');
    expect(button).toHaveClass('button--primary');
  });
});
```

#### System Testing
```javascript
// tests/systems/EnvironmentSystem.test.js
import { EnvironmentSystem } from '../../src/systems/EnvironmentSystem';

describe('EnvironmentSystem', () => {
  let system;
  let mockEventSystem;

  beforeEach(() => {
    mockEventSystem = {
      emit: jest.fn(),
      on: jest.fn()
    };
    system = new EnvironmentSystem(mockEventSystem);
  });

  test('initializes with default season', () => {
    expect(system.getCurrentSeason()).toBe('spring');
  });

  test('changes season correctly', () => {
    system.setSeason('summer');
    expect(system.getCurrentSeason()).toBe('summer');
    expect(mockEventSystem.emit).toHaveBeenCalledWith('season:changed', 'summer');
  });

  test('updates weather conditions', () => {
    system.setWeather('rainy');
    expect(system.getCurrentWeather()).toBe('rainy');
    expect(mockEventSystem.emit).toHaveBeenCalledWith('weather:changed', 'rainy');
  });
});
```

### 🔗 Integration Testing

#### System Integration
```javascript
// tests/integration/GameEngine.test.js
import { GameEngine } from '../../src/core/GameEngine';
import { EnvironmentSystem } from '../../src/systems/EnvironmentSystem';
import { UISystem } from '../../src/systems/UISystem';

describe('GameEngine Integration', () => {
  let engine;
  let environmentSystem;
  let uiSystem;

  beforeEach(() => {
    engine = new GameEngine();
    environmentSystem = new EnvironmentSystem();
    uiSystem = new UISystem();
    
    engine.registerSystem('environment', environmentSystem);
    engine.registerSystem('ui', uiSystem);
  });

  test('systems communicate through event system', () => {
    // Simulate season change
    environmentSystem.setSeason('winter');
    
    // Verify UI system received the event
    expect(uiSystem.getDisplayedSeason()).toBe('winter');
  });

  test('update loop processes all systems', () => {
    const updateSpy = jest.spyOn(environmentSystem, 'update');
    const uiUpdateSpy = jest.spyOn(uiSystem, 'update');
    
    engine.update(16.67); // One frame at 60fps
    
    expect(updateSpy).toHaveBeenCalled();
    expect(uiUpdateSpy).toHaveBeenCalled();
  });
});
```

### 🌐 E2E Testing with Playwright

#### Game Flow Testing
```javascript
// tests/e2e/game-flow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('complete game session', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for game to load
    await page.waitForSelector('#scene-container');
    
    // Change season
    await page.click('[data-category="spring"]');
    await expect(page.locator('.season-display')).toContainText('Spring');
    
    // Add object to scene
    await page.click('[data-category="tree"]');
    await page.click('#scene-container');
    
    // Verify object was added
    await expect(page.locator('.object-count')).toContainText('1');
  });

  test('responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    
    // Verify mobile layout
    await expect(page.locator('.sidebar')).toHaveCSS('position', 'absolute');
    await expect(page.locator('.controls-dock')).not.toBeVisible();
  });
});
```

## 🔧 Development Tools

### 📝 ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### 🎨 Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 🔍 TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 📊 Code Quality Metrics

### 📈 Coverage Requirements
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'jsdom'
};
```

### 🔍 Performance Testing
```javascript
// tests/performance/rendering.test.js
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';

describe('Rendering Performance', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  test('maintains 60fps under normal load', () => {
    const startTime = performance.now();
    let frameCount = 0;
    
    const renderFrame = () => {
      frameCount++;
      if (frameCount < 60) {
        requestAnimationFrame(renderFrame);
      }
    };
    
    requestAnimationFrame(renderFrame);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    const fps = frameCount / (duration / 1000);
    
    expect(fps).toBeGreaterThan(55); // Allow small variance
  });

  test('memory usage remains stable', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Simulate heavy operations
    for (let i = 0; i < 1000; i++) {
      new Array(1000).fill(0);
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## 🚀 CI/CD Pipeline

### 🔄 GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Build project
      run: npm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: echo "Deploy to production server"
```

### 📦 Automated Testing
```javascript
// scripts/test-automation.js
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

class TestAutomation {
  constructor() {
    this.results = [];
  }

  async runAllTests() {
    console.log('🧪 Starting automated test suite...');
    
    try {
      // Run unit tests
      await this.runUnitTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run performance tests
      await this.runPerformanceTests();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('📋 Running unit tests...');
    execSync('npm run test:coverage', { stdio: 'inherit' });
  }

  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    execSync('npm run test:integration', { stdio: 'inherit' });
  }

  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    execSync('npm run test:performance', { stdio: 'inherit' });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: this.calculateSummary()
    };

    writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    console.log('📊 Test report generated: test-report.json');
  }

  calculateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = total - passed;

    return { total, passed, failed, successRate: (passed / total) * 100 };
  }
}

// Run automation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const automation = new TestAutomation();
  automation.runAllTests();
}
```

## 📚 Development Guidelines

### 📝 Code Standards
```javascript
// .eslintrc.js - Additional rules
rules: {
  // Naming conventions
  'camelcase': 'error',
  'id-length': ['error', { 'min': 2, 'max': 30 }],
  
  // Code complexity
  'complexity': ['error', 10],
  'max-depth': ['error', 4],
  'max-lines-per-function': ['error', 50],
  
  // Performance
  'no-loop-func': 'error',
  'no-new-func': 'error',
  
  // Three.js specific
  'no-new': 'off', // Allow new THREE.Object3D()
  'no-unused-expressions': 'off' // Allow chaining
}
```

### 🏗️ Architecture Guidelines
```javascript
// Architecture rules
const architectureRules = {
  // File size limits
  maxFileSize: '500 lines',
  maxFunctionSize: '50 lines',
  
  // Import organization
  importOrder: [
    'three',
    'external libraries',
    'internal modules',
    'relative imports'
  ],
  
  // Naming conventions
  naming: {
    classes: 'PascalCase',
    functions: 'camelCase',
    constants: 'UPPER_SNAKE_CASE',
    files: 'kebab-case'
  }
};
```

## 🎯 Implementation Roadmap

### 📋 Phase 1: Foundation (Week 1-2)
1. **Development Environment** 설정
2. **Basic Testing** 구조 구축
3. **Linting & Formatting** 설정
4. **CI/CD Pipeline** 기본 구조

### 📋 Phase 2: Testing Infrastructure (Week 3-4)
1. **Unit Tests** 작성 (Components, Systems)
2. **Integration Tests** 구현
3. **Performance Tests** 추가
4. **Coverage Reports** 설정

### 📋 Phase 3: Quality Assurance (Week 5-6)
1. **E2E Tests** 구현
2. **Automated Testing** 스크립트
3. **Performance Monitoring** 강화
4. **Documentation** 완성

---

**Next**: [Technical Specifications](./05-technical-specifications.md)
