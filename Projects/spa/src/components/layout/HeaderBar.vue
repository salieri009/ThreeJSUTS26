<template>
  <header class="app-header">
    <!-- Brand Section -->
    <div class="header-brand" @click="goHome">
      <div class="brand-logo">
        <svg viewBox="0 0 100 100" class="logo-icon">
          <path d="M20,80 Q20,20 50,20 Q80,20 80,80" fill="none" stroke="currentColor" stroke-width="3"/>
          <circle cx="30" cy="70" r="3" fill="currentColor"/>
          <circle cx="50" cy="65" r="3" fill="currentColor"/>
          <circle cx="70" cy="70" r="3" fill="currentColor"/>
        </svg>
      </div>
      <div class="brand-text">
        <h1 class="brand-title">Animal Simulator</h1>
        <p class="brand-subtitle">Smart Farm Experience</p>
      </div>
    </div>
    
    <!-- Navigation Section -->
    <nav class="header-nav" :class="{ 'mobile-hidden': isMobile }">
      <a href="#dashboard" class="nav-item" :class="{ active: activeRoute === 'dashboard' }" @click="setActiveRoute('dashboard')">
        Dashboard
      </a>
      <a href="#farms" class="nav-item" :class="{ active: activeRoute === 'farms' }" @click="setActiveRoute('farms')">
        My Farms
      </a>
      <a href="#community" class="nav-item" :class="{ active: activeRoute === 'community' }" @click="setActiveRoute('community')">
        Community
      </a>
      <a href="#marketplace" class="nav-item" :class="{ active: activeRoute === 'marketplace' }" @click="setActiveRoute('marketplace')">
        Marketplace
      </a>
      <!-- Developer Link -->
      <a href="https://salieri009.studio/" target="_blank" rel="noopener noreferrer" class="nav-item developer-link">
        Developer
      </a>
    </nav>
    
    <!-- Mobile Menu Button -->
    <button v-if="isMobile" class="mobile-menu-btn" @click="toggleMobileMenu">
      <i class="icon-menu">{{ mobileMenuOpen ? '✕' : '☰' }}</i>
    </button>
    
    <!-- User Actions Section -->
    <div class="header-actions">
      <button class="action-btn search-btn" @click="toggleSearch" :class="{ active: searchOpen }">
        <i class="icon-search">🔍</i>
        <div class="action-tooltip">
          Search
          <span class="shortcut-hint">Ctrl+K</span>
        </div>
      </button>
      
      <button class="action-btn notification-btn" @click="toggleNotifications" :class="{ active: notificationsOpen }">
        <i class="icon-bell">🔔</i>
        <div class="notification-badge" v-if="notificationCount > 0">{{ notificationCount }}</div>
        <div class="action-tooltip">
          Notifications
          <span class="shortcut-hint">{{ notificationCount }} new</span>
        </div>
      </button>
      
      <button class="action-btn settings-btn" @click="toggleSettings" :class="{ active: settingsOpen }">
        <i class="icon-settings">⚙️</i>
        <div class="action-tooltip">Settings</div>
      </button>
      
      <button class="action-btn theme-toggle" @click="toggleTheme">
        <i class="icon-theme">{{ themeIcon }}</i>
        <div class="action-tooltip">
          {{ currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode' }}
        </div>
      </button>
      
      <div class="profile-avatar" @click="toggleProfile" :class="{ active: profileOpen }">
        <img :src="userAvatar" :alt="userName" />
        <div class="profile-status" :class="userStatus"></div>
      </div>
    </div>
    
    <!-- Mobile Navigation Overlay -->
    <div v-if="isMobile && mobileMenuOpen" class="mobile-nav-overlay" @click="closeMobileMenu">
      <nav class="mobile-nav" @click.stop>
        <div class="mobile-nav-header">
          <div class="brand-text">
            <h2 class="brand-title">Navigation</h2>
          </div>
          <button class="mobile-nav-close" @click="closeMobileMenu">✕</button>
        </div>
        <div class="mobile-nav-items">
          <a href="#dashboard" class="mobile-nav-item" :class="{ active: activeRoute === 'dashboard' }" @click="setActiveRouteAndClose('dashboard')">
            <i class="nav-icon">📊</i>
            Dashboard
          </a>
          <a href="#farms" class="mobile-nav-item" :class="{ active: activeRoute === 'farms' }" @click="setActiveRouteAndClose('farms')">
            <i class="nav-icon">🌾</i>
            My Farms
          </a>
          <a href="#community" class="mobile-nav-item" :class="{ active: activeRoute === 'community' }" @click="setActiveRouteAndClose('community')">
            <i class="nav-icon">👥</i>
            Community
          </a>
          <a href="#marketplace" class="mobile-nav-item" :class="{ active: activeRoute === 'marketplace' }" @click="setActiveRouteAndClose('marketplace')">
            <i class="nav-icon">🛒</i>
            Marketplace
          </a>
          <a href="https://salieri009.studio/" target="_blank" rel="noopener noreferrer" class="mobile-nav-item developer-link">
            <i class="nav-icon">👨‍💻</i>
            Developer
          </a>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Reactive state
const currentTheme = ref<'light' | 'dark' | 'auto'>('auto')
const notificationCount = ref(3)
const searchOpen = ref(false)
const notificationsOpen = ref(false)
const profileOpen = ref(false)
const settingsOpen = ref(false)
const mobileMenuOpen = ref(false)
const activeRoute = ref('dashboard')
const isMobile = ref(false)

// User data
const userName = ref('Farm Manager')
const userAvatar = ref('/images/default-avatar.png')
const userStatus = ref<'online' | 'away' | 'busy' | 'offline'>('online')

// Computed properties
const themeIcon = computed(() => {
  switch (currentTheme.value) {
    case 'light': return '☀️'
    case 'dark': return '🌙'
    default: return '🌓'
  }
})

// Methods
const goHome = () => {
  activeRoute.value = 'dashboard'
  console.log('Navigate to home')
}

const setActiveRoute = (route: string) => {
  activeRoute.value = route
}

const setActiveRouteAndClose = (route: string) => {
  activeRoute.value = route
  mobileMenuOpen.value = false
}

const toggleSearch = () => {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    closeAllMenus()
    console.log('Search toggled:', searchOpen.value)
  }
}

const toggleNotifications = () => {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value) {
    closeOtherMenus('notifications')
    console.log('Notifications toggled:', notificationsOpen.value)
  }
}

const toggleSettings = () => {
  settingsOpen.value = !settingsOpen.value
  if (settingsOpen.value) {
    closeOtherMenus('settings')
    console.log('Settings toggled:', settingsOpen.value)
  }
}

const toggleProfile = () => {
  profileOpen.value = !profileOpen.value
  if (profileOpen.value) {
    closeOtherMenus('profile')
    console.log('Profile toggled:', profileOpen.value)
  }
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    closeAllMenus()
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const closeAllMenus = () => {
  searchOpen.value = false
  notificationsOpen.value = false
  profileOpen.value = false
  settingsOpen.value = false
}

const closeOtherMenus = (except: string) => {
  if (except !== 'search') searchOpen.value = false
  if (except !== 'notifications') notificationsOpen.value = false
  if (except !== 'profile') profileOpen.value = false
  if (except !== 'settings') settingsOpen.value = false
  mobileMenuOpen.value = false
}

const toggleTheme = () => {
  const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']
  const currentIndex = themes.indexOf(currentTheme.value)
  const nextIndex = (currentIndex + 1) % themes.length
  currentTheme.value = themes[nextIndex]
  
  applyTheme(currentTheme.value)
  localStorage.setItem('theme', currentTheme.value)
  console.log('Theme changed to:', currentTheme.value)
}

const applyTheme = (theme: string) => {
  document.documentElement.setAttribute('data-theme', theme)
  
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleResize = () => {
  checkMobile()
  if (!isMobile.value) {
    mobileMenuOpen.value = false
  }
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.header-actions') && !target.closest('.mobile-nav')) {
    closeAllMenus()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault()
    toggleSearch()
  }
  
  if (event.key === 'Escape') {
    closeAllMenus()
    closeMobileMenu()
  }
  
  if (event.altKey && event.key === 't') {
    event.preventDefault()
    toggleTheme()
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
  if (savedTheme) {
    currentTheme.value = savedTheme
  }
  applyTheme(currentTheme.value)
  
  checkMobile()
  
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleMediaChange = () => {
    if (currentTheme.value === 'auto') {
      applyTheme('auto')
    }
  }
  mediaQuery.addEventListener('change', handleMediaChange)
  
  console.log('HeaderBar initialized')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
})

watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
})
</script>

<style scoped>
/* Future Header Styles */
.app-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  padding: 0 1.5rem;
  height: 72px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Brand Section */
.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.header-brand:hover {
  transform: scale(1.02);
}

.brand-logo {
  width: 40px;
  height: 40px;
  position: relative;
}

.logo-icon {
  width: 100%;
  height: 100%;
  color: var(--primary-500);
  filter: drop-shadow(0 0 8px var(--primary-500));
  animation: logo-pulse 3s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { filter: drop-shadow(0 0 8px var(--primary-500)); }
  50% { filter: drop-shadow(0 0 16px var(--primary-400)); }
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--primary-500);
  line-height: var(--leading-tight);
  margin: 0;
}

.brand-subtitle {
  font-size: var(--text-xs);
  color: var(--neutral-500);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

/* Navigation Section */
.header-nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.header-nav.mobile-hidden {
  display: none;
}

.nav-item {
  position: relative;
  padding: 0.5rem 1rem;
  color: var(--neutral-600);
  font-weight: var(--font-medium);
  text-decoration: none;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--primary-500);
  background: var(--primary-50);
}

.nav-item.active {
  color: var(--primary-600);
  background: var(--primary-100);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  border-radius: 1px;
  animation: nav-glow 2s ease-in-out infinite;
}

@keyframes nav-glow {
  0%, 100% { box-shadow: 0 0 4px var(--primary-500); }
  50% { box-shadow: 0 0 12px var(--primary-400); }
}

/* Developer Link Special Styling */
.nav-item.developer-link {
  background: linear-gradient(135deg, var(--secondary-100), var(--accent-100));
  color: var(--secondary-700);
  border: 1px solid var(--secondary-200);
}

.nav-item.developer-link:hover {
  background: linear-gradient(135deg, var(--secondary-200), var(--accent-200));
  color: var(--secondary-800);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--neutral-600);
  cursor: pointer;
  font-size: var(--text-lg);
  transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
  color: var(--primary-600);
  background: var(--primary-50);
  border-radius: var(--radius-lg);
}

/* User Actions Section */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  color: var(--neutral-600);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--primary-50);
  color: var(--primary-600);
  border-color: var(--primary-200);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn.active {
  background: var(--primary-100);
  color: var(--primary-700);
  border-color: var(--primary-300);
}

/* Theme Toggle Special Effect */
.theme-toggle {
  position: relative;
  overflow: hidden;
}

.theme-toggle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: conic-gradient(from 0deg, var(--primary-500), var(--secondary-500), var(--accent-500), var(--primary-500));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-toggle:hover::before {
  opacity: 0.1;
}

/* Notification Badge */
.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  background: var(--error);
  color: white;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  animation: notification-pulse 2s ease-in-out infinite;
}

@keyframes notification-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

/* Profile Avatar */
.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: 2px solid var(--primary-200);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.profile-avatar:hover {
  border-color: var(--primary-500);
  transform: scale(1.1);
  box-shadow: 0 0 16px var(--primary-200);
}

.profile-avatar.active {
  border-color: var(--primary-600);
  box-shadow: 0 0 20px var(--primary-300);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.profile-status.online { background: var(--success); }
.profile-status.away { background: var(--warning); }
.profile-status.busy { background: var(--error); }
.profile-status.offline { background: var(--neutral-400); }

/* Tooltips */
.action-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--neutral-900);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  z-index: 100;
  max-width: 200px;
}

.action-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--neutral-900);
}

.action-btn:hover .action-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-12px);
}

.shortcut-hint {
  font-size: 10px;
  color: var(--neutral-400);
  margin-left: 0.25rem;
  background: var(--neutral-700);
  padding: 1px 4px;
  border-radius: 2px;
}

/* Mobile Navigation Overlay */
.mobile-nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  animation: overlay-fade-in 0.3s ease;
}

@keyframes overlay-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  animation: nav-slide-in 0.3s ease;
}

@keyframes nav-slide-in {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--glass-border);
}

.mobile-nav-close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--glass-bg);
  color: var(--neutral-600);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-nav-close:hover {
  background: var(--error);
  color: white;
}

.mobile-nav-items {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: var(--neutral-700);
  text-decoration: none;
  border-radius: var(--radius-xl);
  transition: all 0.2s ease;
  font-weight: var(--font-medium);
}

.mobile-nav-item:hover {
  background: var(--primary-50);
  color: var(--primary-700);
  transform: translateX(4px);
}

.mobile-nav-item.active {
  background: var(--primary-100);
  color: var(--primary-800);
  transform: translateX(8px);
}

.mobile-nav-item.developer-link {
  background: linear-gradient(135deg, var(--secondary-50), var(--accent-50));
  color: var(--secondary-700);
  border: 1px solid var(--secondary-200);
  margin-top: auto;
}

.nav-icon {
  font-size: var(--text-lg);
  width: 24px;
  text-align: center;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .app-header {
    padding: 0 1rem;
    height: 64px;
  }
  
  .header-nav {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .brand-subtitle {
    display: none;
  }
  
  .header-actions {
    gap: 0.5rem;
  }
  
  .action-btn {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .header-nav {
    gap: 1rem;
  }
  
  .nav-item {
    padding: 0.25rem 0.75rem;
    font-size: var(--text-sm);
  }
}

/* Dark theme adjustments */
[data-theme="dark"] .mobile-nav {
  background: rgba(0, 0, 0, 0.8);
}

[data-theme="dark"] .action-tooltip {
  background: var(--neutral-100);
  color: var(--neutral-900);
}

[data-theme="dark"] .action-tooltip::after {
  border-top-color: var(--neutral-100);
}
</style>