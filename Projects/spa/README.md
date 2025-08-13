# 🌾 Animal Simulator SPA

> **Interactive 3D Farm Simulator** built with Vue 3, TypeScript, and Three.js

A modern, futuristic single-page application that allows users to create and manage their own virtual farm with animals, buildings, and dynamic environmental effects.

## ✨ Features

### 🎯 Core Functionality
- **3D Scene Management** - Interactive isometric farm view
- **Model System** - GLTF loading with caching and fallback support
- **Environment System** - Dynamic weather, seasons, and time of day
- **Interaction System** - Mouse/touch controls with drag & drop
- **Component Architecture** - Modular Vue 3 components with TypeScript

### 🎨 UI/UX Design
- **Minimal Design Language** - Clean, accessible interface
- **Glassmorphism Effects** - Modern frosted glass aesthetics
- **Responsive Layout** - Mobile-first design with grid system
- **Dark/Light Theme** - Automatic theme switching
- **Performance Optimized** - 60fps with hardware acceleration

### 🌦️ Environmental Effects
- **Weather System**: Sunny, Cloudy, Rainy, Stormy, Snowy, Foggy
- **Seasonal Changes**: Spring (Cherry Blossoms), Summer (Fireflies), Autumn (Falling Leaves), Winter (Snow)
- **Time Cycle**: 24-hour day/night cycle with dynamic lighting
- **Particle Systems**: 1000+ particles for rain, snow, and seasonal effects

### 🎮 Interaction Features
- **Object Placement** - Drag & drop from sidebar to 3D scene
- **Selection System** - Single/multi-select with visual feedback
- **Camera Controls** - Orbit, zoom, pan with smooth damping
- **Keyboard Shortcuts** - G (move), R (rotate), S (scale), Delete (remove)
- **Touch Support** - Full mobile/tablet compatibility

## 🚀 Tech Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **3D Engine**: Three.js
- **Styling**: CSS Variables + Modern CSS Features
- **Architecture**: Component-based with clean separation

## 📁 Project Structure

```
spa/
├── src/
│   ├── components/
│   │   ├── layout/           # Header, Footer, Sidebar, Controls
│   │   ├── scene/            # 3D Scene Canvas
│   │   └── overlay/          # Floating UI elements
│   ├── core/
│   │   └── ThreeJSCore.ts    # 3D engine wrapper
│   ├── systems/
│   │   ├── ModelSystem.ts    # GLTF loading & instances
│   │   ├── EnvironmentSystem.ts  # Weather, seasons, time
│   │   └── InteractionSystem.ts  # User interactions
│   ├── styles/
│   │   ├── theme.css         # Global theme system
│   │   └── minimal-interactions.css  # Button styles
│   ├── App.vue               # Root component
│   └── main.ts               # Application entry point
├── public/
│   ├── icons/                # PWA icons
│   ├── favicon.ico
│   └── manifest.json         # Web app manifest
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

- `npm run dev` - Start Vite dev server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## 🎯 Component System

### Layout Components
- **HeaderBar** - Brand, theme toggle, developer link
- **FooterBar** - Status info, quick stats, actions
- **LeftSidebar** - Category navigation with search
- **RightDock** - Environment controls and settings

### Scene Components
- **SceneCanvas** - Three.js integration with Vue
- **CenterActions** - Floating action buttons

### Overlay Components
- **ItemPanel** - Item selection with filtering
- **Notifications** - Global notification system

## 🌈 Theme System

### Color Palette
- **Primary**: Indigo (#6366f1) - Main actions, focus states
- **Secondary**: Teal (#14b8a6) - Secondary actions, highlights
- **Accent**: Amber (#f59e0b) - Warnings, special elements
- **Neutral**: Slate grays - Text, borders, backgrounds

### CSS Variables
```css
:root {
  /* Colors */
  --primary-500: #6366f1;
  --secondary-500: #14b8a6;
  --accent-500: #f59e0b;
  
  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-backdrop: blur(16px);
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  
  /* Shadows */
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

## 🎮 Controls & Shortcuts

### Mouse Controls
- **Left Click** - Select objects
- **Ctrl + Click** - Multi-select
- **Right Click** - Context menu
- **Mouse Wheel** - Zoom camera
- **Drag** - Orbit camera

### Keyboard Shortcuts
- **G** - Move mode
- **R** - Rotate mode  
- **S** - Scale mode
- **Delete/Backspace** - Remove selected
- **Escape** - Clear selection
- **Ctrl + A** - Select all
- **Ctrl + S** - Save scene
- **F2** - Toggle theme
- **F3** - Toggle performance monitor

### Touch Controls
- **Tap** - Select
- **Long Press** - Context menu
- **Pinch** - Zoom
- **Two-finger Drag** - Pan camera

## 🚀 Performance

### Optimizations
- **Hardware Acceleration** - GPU-optimized rendering
- **Instance Management** - Efficient object reuse
- **Texture Compression** - DRACO geometry compression  
- **Level of Detail** - Distance-based quality scaling
- **Frustum Culling** - Only render visible objects

### Monitoring
- **FPS Counter** - Real-time performance tracking
- **Memory Usage** - GPU/CPU memory monitoring
- **Draw Calls** - Render optimization metrics
- **Triangle Count** - Geometry complexity tracking

## 🌍 Browser Support

- **Chrome** 90+ ✅
- **Firefox** 88+ ✅  
- **Safari** 14+ ✅
- **Edge** 90+ ✅
- **Mobile Safari** 14+ ✅
- **Chrome Mobile** 90+ ✅

## 📱 PWA Features

- **Offline Support** - Service worker caching
- **Install Prompt** - Add to home screen
- **App Icons** - Multiple resolution icons
- **Splash Screen** - Custom loading screen
- **Theme Color** - Status bar styling

## 🔧 Configuration

### Vite Config
```typescript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### TypeScript Config
- **Strict Mode** - Maximum type safety
- **Path Mapping** - Clean import paths
- **Vue SFC Support** - Single file components
- **Modern Target** - ES2022 output

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js** - 3D graphics library
- **Vue 3** - Progressive JavaScript framework  
- **Vite** - Next generation frontend tooling
- **Inter Font** - Beautiful typography
- **Lucide Icons** - Clean iconography

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [Coming Soon]
- **Developer**: [https://salieri009.studio/](https://salieri009.studio/)

---

**Made with ❤️ and ☕ by the Animal Simulator Team**