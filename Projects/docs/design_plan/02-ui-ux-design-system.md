# 🎨 UI/UX Design System

## 🎯 Design Philosophy

### 🌟 Core Principles
1. **Accessibility First**: 모든 사용자가 접근 가능한 인터페이스
2. **Responsive Design**: 모든 디바이스에서 일관된 경험
3. **Performance**: 60fps 유지를 위한 최적화된 애니메이션
4. **Consistency**: 일관된 디자인 언어와 상호작용 패턴

### 🎨 Visual Identity
- **Color Palette**: 자연 친화적 색상 (녹색, 파란색, 갈색 계열)
- **Typography**: 가독성 높은 폰트 (Inter, Noto Sans)
- **Spacing**: 8px 그리드 시스템 기반
- **Shadows**: 깊이감을 표현하는 계층적 그림자

## 🎨 Design Tokens

### 🎨 Colors
```css
:root {
  /* Primary Colors */
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0284c7;
  --color-primary-900: #0c4a6e;
  
  /* Secondary Colors */
  --color-secondary-50: #f0fdf4;
  --color-secondary-100: #dcfce7;
  --color-secondary-500: #22c55e;
  --color-secondary-600: #16a34a;
  --color-secondary-900: #14532d;
  
  /* Neutral Colors */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-900: #0f172a;
  
  /* Semantic Colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### 📏 Spacing
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
}
```

### 🔤 Typography
```css
:root {
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### 🎭 Shadows
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
```

## 🧩 Component Library

### 🔘 Button Components
```javascript
// Base Button Class
class Button extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading'];
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }
  
  render() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'medium';
    const disabled = this.hasAttribute('disabled');
    const loading = this.hasAttribute('loading');
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: var(--font-family-sans);
        }
        
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: var(--radius-md);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        
        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Variants */
        .button--primary {
          background: var(--color-primary-600);
          color: white;
        }
        
        .button--secondary {
          background: var(--color-secondary-600);
          color: white;
        }
        
        .button--outline {
          background: transparent;
          border: 2px solid var(--color-primary-600);
          color: var(--color-primary-600);
        }
        
        /* Sizes */
        .button--small {
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: var(--font-size-sm);
        }
        
        .button--medium {
          padding: var(--spacing-md) var(--spacing-lg);
          font-size: var(--font-size-base);
        }
        
        .button--large {
          padding: var(--spacing-lg) var(--spacing-xl);
          font-size: var(--font-size-lg);
        }
      </style>
      
      <button class="button button--${variant} button--${size}" ?disabled="${disabled}">
        ${loading ? '<span class="spinner"></span>' : ''}
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('ui-button', Button);
```

### 📊 Panel Components
```javascript
class Panel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['variant', 'elevation'];
  }
  
  render() {
    const variant = this.getAttribute('variant') || 'default';
    const elevation = this.getAttribute('elevation') || 'medium';
    
    this.shadowRoot.innerHTML = `
      <style>
        .panel {
          background: var(--color-neutral-50);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-${elevation});
          border: 1px solid var(--color-neutral-200);
        }
        
        .panel--glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .panel--dark {
          background: var(--color-neutral-900);
          color: var(--color-neutral-50);
          border-color: var(--color-neutral-700);
        }
      </style>
      
      <div class="panel panel--${variant}">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('ui-panel', Panel);
```

### 🎛️ Control Components
```javascript
class Slider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  static get observedAttributes() {
    return ['min', 'max', 'step', 'value', 'disabled'];
  }
  
  render() {
    const min = this.getAttribute('min') || 0;
    const max = this.getAttribute('max') || 100;
    const step = this.getAttribute('step') || 1;
    const value = this.getAttribute('value') || min;
    const disabled = this.hasAttribute('disabled');
    
    this.shadowRoot.innerHTML = `
      <style>
        .slider-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .slider {
          flex: 1;
          height: 6px;
          background: var(--color-neutral-200);
          border-radius: var(--radius-full);
          outline: none;
          cursor: pointer;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: var(--color-primary-600);
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .value-display {
          min-width: 60px;
          text-align: right;
          font-weight: var(--font-weight-medium);
          color: var(--color-neutral-600);
        }
      </style>
      
      <div class="slider-container">
        <input 
          type="range" 
          class="slider"
          min="${min}"
          max="${max}"
          step="${step}"
          value="${value}"
          ?disabled="${disabled}"
        />
        <span class="value-display">${value}</span>
      </div>
    `;
  }
}

customElements.define('ui-slider', Slider);
```

## 📱 Responsive Design System

### 🖥️ Breakpoint System
```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Container Max Widths */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

### 📐 Grid System
```css
.grid {
  display: grid;
  gap: var(--spacing-md);
}

.grid--cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid--cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid--cols-5 { grid-template-columns: repeat(5, 1fr); }
.grid--cols-6 { grid-template-columns: repeat(6, 1fr); }

@media (max-width: 768px) {
  .grid--cols-4,
  .grid--cols-5,
  .grid--cols-6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid--cols-2,
  .grid--cols-3,
  .grid--cols-4,
  .grid--cols-5,
  .grid--cols-6 {
    grid-template-columns: 1fr;
  }
}
```

## 🎭 Animation System

### ⚡ Performance-First Animations
```css
/* CSS Custom Properties for Animation */
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-medium: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Optimized Transitions */
.button {
  transition: 
    background-color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
  
  /* GPU acceleration */
  will-change: transform;
  transform: translateZ(0);
}

/* Hover Effects */
.button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Active States */
.button:active {
  transform: translateY(0);
  transition-duration: 100ms;
}
```

### 🎬 JavaScript Animation Controller
```javascript
class AnimationController {
  constructor() {
    this.animations = new Map();
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  // Fade In Animation
  fadeIn(element, duration = 300) {
    if (this.isReducedMotion) {
      element.style.opacity = '1';
      return;
    }
    
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms var(--ease-out)`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }
  
  // Slide In Animation
  slideIn(element, direction = 'up', duration = 300) {
    if (this.isReducedMotion) {
      element.style.transform = 'none';
      return;
    }
    
    const transforms = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)'
    };
    
    element.style.transform = transforms[direction];
    element.style.transition = `transform ${duration}ms var(--ease-out)`;
    
    requestAnimationFrame(() => {
      element.style.transform = 'none';
    });
  }
  
  // Stagger Animation for Lists
  stagger(elements, delay = 50, animation = 'fadeIn') {
    elements.forEach((element, index) => {
      setTimeout(() => {
        this[animation](element);
      }, index * delay);
    });
  }
}
```

## ♿ Accessibility Features

### 🎯 ARIA Support
```javascript
class AccessibleComponent extends HTMLElement {
  constructor() {
    super();
    this.setupAccessibility();
  }
  
  setupAccessibility() {
    // Role and state management
    this.setAttribute('role', this.getAttribute('role') || 'button');
    
    // Keyboard navigation
    this.setAttribute('tabindex', '0');
    this.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Screen reader support
    if (!this.hasAttribute('aria-label')) {
      const text = this.textContent?.trim();
      if (text) {
        this.setAttribute('aria-label', text);
      }
    }
  }
  
  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.click();
        break;
      case 'Escape':
        this.blur();
        break;
    }
  }
}
```

### 🎨 Focus Management
```css
/* Focus Styles */
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Skip Link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary-600);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: var(--radius-md);
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

## 🧪 Component Testing

### 📋 Testing Strategy
```javascript
// Component Test Example
describe('Button Component', () => {
  let button;
  
  beforeEach(() => {
    button = document.createElement('ui-button');
    button.setAttribute('variant', 'primary');
    button.textContent = 'Test Button';
    document.body.appendChild(button);
  });
  
  afterEach(() => {
    document.body.removeChild(button);
  });
  
  it('should render with correct variant', () => {
    const shadowRoot = button.shadowRoot;
    const buttonElement = shadowRoot.querySelector('.button');
    
    expect(buttonElement).toHaveClass('button--primary');
  });
  
  it('should handle click events', () => {
    const clickSpy = jest.fn();
    button.addEventListener('click', clickSpy);
    
    button.click();
    expect(clickSpy).toHaveBeenCalled();
  });
  
  it('should be keyboard accessible', () => {
    button.focus();
    expect(button).toHaveFocus();
    
    const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    button.dispatchEvent(keyEvent);
    
    // Verify click was triggered
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
```

## 🚀 Implementation Roadmap

### 📋 Phase 1: Foundation (Week 1-2)
1. **Design Token System** 구현
2. **Base Component Classes** 생성
3. **CSS Custom Properties** 설정
4. **Basic Components** (Button, Panel, Slider)

### 📋 Phase 2: Core Components (Week 3-4)
1. **Form Components** (Input, Select, Checkbox)
2. **Layout Components** (Grid, Container, Stack)
3. **Feedback Components** (Toast, Modal, Tooltip)
4. **Navigation Components** (Breadcrumb, Pagination)

### 📋 Phase 3: Advanced Features (Week 5-6)
1. **Animation System** 구현
2. **Theme System** (Light/Dark mode)
3. **Responsive Utilities** 추가
4. **Accessibility Features** 강화

---

**Next**: [Performance & Optimization](./03-performance-optimization.md)
