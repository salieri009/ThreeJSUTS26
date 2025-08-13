<template>
  <aside class="left-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="sidebar-title" v-if="!isCollapsed">
        <i class="title-icon">🏗️</i>
        Build & Create
      </div>
      <button class="sidebar-collapse-btn" @click="toggleCollapse" :title="isCollapsed ? 'Expand' : 'Collapse'">
        <i class="collapse-icon">{{ isCollapsed ? '▶️' : '◀️' }}</i>
      </button>
    </div>

    <!-- Search Section -->
    <div class="sidebar-search" v-if="!isCollapsed">
      <div class="search-wrapper">
        <i class="search-icon">🔍</i>
        <input
          type="text"
          class="search-input"
          placeholder="Search items..."
          v-model="searchQuery"
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">
          <i>✕</i>
        </button>
      </div>
    </div>

    <!-- Category Groups -->
    <div class="category-groups">
      <div
        v-for="category in categories"
        :key="category.id"
        class="category-group"
      >
        <button
          class="category-button"
          :class="{ active: activeCategory === category.id }"
          @click="selectCategory(category.id)"
          :title="category.label"
        >
          <div class="category-icon">{{ category.icon }}</div>
          <div class="category-content" v-if="!isCollapsed">
            <span class="category-label">{{ category.label }}</span>
            <span class="category-count">{{ category.items.length }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Quick Stats (if collapsed) -->
    <div class="quick-stats" v-if="isCollapsed">
      <div class="stat-item" title="Total Items">
        <i class="stat-icon">📦</i>
        <span class="stat-value">{{ totalItems }}</span>
      </div>
      <div class="stat-item" title="Active Category">
        <i class="stat-icon">{{ activeCategoryIcon }}</i>
        <span class="stat-value">{{ activeCategoryCount }}</span>
      </div>
    </div>

    <!-- Item Panel (Floating) -->
    <div
      v-if="activeCategory && showItemPanel"
      class="item-panel"
      :class="{ open: showItemPanel }"
      @click.stop
    >
      <div class="item-panel-header">
        <div class="item-panel-title">
          <i class="panel-icon">{{ activeCategoryData?.icon }}</i>
          {{ activeCategoryData?.label }}
        </div>
        <button class="item-panel-close" @click="closeItemPanel">
          <i>✕</i>
        </button>
      </div>

      <div class="item-panel-content">
        <!-- Filter Options -->
        <div class="item-filters" v-if="filteredItems.length > 6">
          <select v-model="sortBy" class="filter-select">
            <option value="name">Sort by Name</option>
            <option value="cost">Sort by Cost</option>
            <option value="popularity">Sort by Popularity</option>
          </select>
        </div>

        <!-- Items Grid -->
        <div class="items-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="item-card"
            :class="{ selected: selectedItem === item.id, dragging: draggedItem === item.id }"
            @click="selectItem(item)"
            @dragstart="startDrag(item, $event)"
            @dragend="endDrag"
            draggable="true"
          >
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-details">
                <span class="item-cost" v-if="item.cost">💰{{ item.cost }}</span>
                <span class="item-rarity" :class="item.rarity">{{ item.rarity }}</span>
              </div>
            </div>
            <div class="item-actions">
              <button class="item-action-btn" @click.stop="addToScene(item)" title="Add to Scene">
                ➕
              </button>
              <button class="item-action-btn" @click.stop="showItemInfo(item)" title="Item Info">
                ℹ️
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredItems.length === 0" class="empty-state">
          <i class="empty-icon">📭</i>
          <p class="empty-message">No items found</p>
          <p class="empty-hint">Try adjusting your search or filters</p>
        </div>
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div
      v-if="showItemPanel && isMobile"
      class="panel-overlay"
      @click="closeItemPanel"
    ></div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Types
interface Item {
  id: string
  name: string
  icon: string
  cost?: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  category: string
  tags: string[]
  description: string
}

interface Category {
  id: string
  label: string
  icon: string
  color: string
  items: Item[]
}

// Reactive state
const isCollapsed = ref(false)
const activeCategory = ref<string | null>(null)
const showItemPanel = ref(false)
const selectedItem = ref<string | null>(null)
const draggedItem = ref<string | null>(null)
const searchQuery = ref('')
const sortBy = ref('name')
const isMobile = ref(false)

// Sample data
const categories = ref<Category[]>([
  {
    id: 'decorations',
    label: 'Decorations',
    icon: '🎁',
    color: 'var(--accent-500)',
    items: [
      { id: 'fountain', name: 'Fountain', icon: '⛲', cost: 150, rarity: 'uncommon', category: 'decorations', tags: ['water', 'decoration'], description: 'Beautiful water fountain' },
      { id: 'statue', name: 'Statue', icon: '🗿', cost: 200, rarity: 'rare', category: 'decorations', tags: ['stone', 'art'], description: 'Ancient stone statue' },
      { id: 'lamp', name: 'Garden Light', icon: '🏮', cost: 75, rarity: 'common', category: 'decorations', tags: ['light', 'garden'], description: 'Warm garden lighting' },
      { id: 'fence', name: 'Wooden Fence', icon: '🪵', cost: 25, rarity: 'common', category: 'decorations', tags: ['wood', 'boundary'], description: 'Rustic wooden fence' }
    ]
  },
  {
    id: 'flora',
    label: 'Flora',
    icon: '🌿',
    color: 'var(--primary-500)',
    items: [
      { id: 'oak', name: 'Oak Tree', icon: '🌳', cost: 100, rarity: 'common', category: 'flora', tags: ['tree', 'shade'], description: 'Mighty oak tree' },
      { id: 'pine', name: 'Pine Tree', icon: '🌲', cost: 80, rarity: 'common', category: 'flora', tags: ['evergreen', 'tall'], description: 'Tall pine tree' },
      { id: 'flowers', name: 'Flower Bed', icon: '🌺', cost: 50, rarity: 'common', category: 'flora', tags: ['colorful', 'beauty'], description: 'Colorful flower arrangement' },
      { id: 'grass', name: 'Grass Patch', icon: '🌱', cost: 15, rarity: 'common', category: 'flora', tags: ['ground', 'green'], description: 'Fresh grass patch' },
      { id: 'cherry', name: 'Cherry Blossom', icon: '🌸', cost: 120, rarity: 'uncommon', category: 'flora', tags: ['pink', 'seasonal'], description: 'Beautiful cherry blossom tree' }
    ]
  },
  {
    id: 'fauna',
    label: 'Fauna',
    icon: '🐾',
    color: 'var(--secondary-500)',
    items: [
      { id: 'cow', name: 'Cow', icon: '🐄', cost: 300, rarity: 'common', category: 'fauna', tags: ['milk', 'large'], description: 'Friendly dairy cow' },
      { id: 'pig', name: 'Pig', icon: '🐷', cost: 250, rarity: 'common', category: 'fauna', tags: ['mud', 'pink'], description: 'Happy farm pig' },
      { id: 'chicken', name: 'Chicken', icon: '🐔', cost: 100, rarity: 'common', category: 'fauna', tags: ['eggs', 'small'], description: 'Egg-laying chicken' },
      { id: 'sheep', name: 'Sheep', icon: '🐑', cost: 200, rarity: 'common', category: 'fauna', tags: ['wool', 'fluffy'], description: 'Woolly sheep' },
      { id: 'horse', name: 'Horse', icon: '🐎', cost: 500, rarity: 'uncommon', category: 'fauna', tags: ['fast', 'noble'], description: 'Majestic horse' },
      { id: 'duck', name: 'Duck', icon: '🦆', cost: 80, rarity: 'common', category: 'fauna', tags: ['water', 'swim'], description: 'Swimming duck' }
    ]
  },
  {
    id: 'buildings',
    label: 'Buildings',
    icon: '🏗️',
    color: 'var(--neutral-600)',
    items: [
      { id: 'barn', name: 'Barn', icon: '🏚️', cost: 800, rarity: 'uncommon', category: 'buildings', tags: ['storage', 'large'], description: 'Large storage barn' },
      { id: 'house', name: 'Farmhouse', icon: '🏠', cost: 1200, rarity: 'rare', category: 'buildings', tags: ['home', 'cozy'], description: 'Cozy farmhouse' },
      { id: 'windmill', name: 'Windmill', icon: '🏭', cost: 600, rarity: 'uncommon', category: 'buildings', tags: ['energy', 'tall'], description: 'Traditional windmill' },
      { id: 'silo', name: 'Silo', icon: '🗼', cost: 400, rarity: 'common', category: 'buildings', tags: ['grain', 'storage'], description: 'Grain storage silo' },
      { id: 'greenhouse', name: 'Greenhouse', icon: '🏢', cost: 900, rarity: 'rare', category: 'buildings', tags: ['glass', 'plants'], description: 'Climate-controlled greenhouse' }
    ]
  }
])

// Computed properties
const totalItems = computed(() => {
  return categories.value.reduce((total, cat) => total + cat.items.length, 0)
})

const activeCategoryData = computed(() => {
  return categories.value.find(cat => cat.id === activeCategory.value)
})

const activeCategoryIcon = computed(() => {
  return activeCategoryData.value?.icon || '📦'
})

const activeCategoryCount = computed(() => {
  return activeCategoryData.value?.items.length || 0
})

const filteredItems = computed(() => {
  if (!activeCategoryData.value) return []
  
  let items = activeCategoryData.value.items
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // Apply sorting
  items = [...items].sort((a, b) => {
    switch (sortBy.value) {
      case 'cost':
        return (a.cost || 0) - (b.cost || 0)
      case 'popularity':
        // Mock popularity based on rarity (reverse order)
        const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 }
        return rarityOrder[b.rarity] - rarityOrder[a.rarity]
      default:
        return a.name.localeCompare(b.name)
    }
  })
  
  return items
})

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  if (isCollapsed.value) {
    showItemPanel.value = false
  }
}

const selectCategory = (categoryId: string) => {
  if (activeCategory.value === categoryId) {
    showItemPanel.value = !showItemPanel.value
  } else {
    activeCategory.value = categoryId
    showItemPanel.value = true
  }
  selectedItem.value = null
}

const closeItemPanel = () => {
  showItemPanel.value = false
  selectedItem.value = null
}

const selectItem = (item: Item) => {
  selectedItem.value = selectedItem.value === item.id ? null : item.id
}

const addToScene = (item: Item) => {
  console.log('Adding item to scene:', item.name)
  // Emit event to parent component
  // emit('add-item', item)
  
  // Show success feedback
  showNotification(`${item.name} added to scene!`, 'success')
}

const showItemInfo = (item: Item) => {
  console.log('Showing item info:', item)
  // Could open a modal or tooltip with detailed information
}

const startDrag = (item: Item, event: DragEvent) => {
  draggedItem.value = item.id
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'copy'
  }
  console.log('Started dragging:', item.name)
}

const endDrag = () => {
  draggedItem.value = null
  console.log('Ended drag')
}

const handleSearch = () => {
  // Search is handled by computed property
  console.log('Searching for:', searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
  // This would integrate with a global notification system
  console.log(`${type.toUpperCase()}: ${message}`)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleResize = () => {
  checkMobile()
  if (isMobile.value && showItemPanel.value) {
    // On mobile, ensure panel is properly positioned
  }
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.left-sidebar') && showItemPanel.value) {
    closeItemPanel()
  }
}

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  document.addEventListener('click', handleClickOutside)
  console.log('LeftSidebar initialized')
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', handleClickOutside)
})

// Watch for mobile changes
watch(isMobile, (newValue) => {
  if (newValue && !isCollapsed.value) {
    // Auto-collapse on mobile for better UX
    // isCollapsed.value = true
  }
})
</script>

<style scoped>
/* Left Sidebar Styles */
.left-sidebar {
  grid-area: sidebar;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--glass-border);
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  overflow-y: auto;
  position: relative;
  width: 280px;
  transition: width 0.3s ease;
}

.left-sidebar.collapsed {
  width: 80px;
  padding: var(--space-6) var(--space-2);
}

.left-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent,
    var(--primary-500),
    var(--secondary-500),
    var(--accent-500),
    transparent
  );
  animation: sidebar-glow 6s ease-in-out infinite;
}

@keyframes sidebar-glow {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.6; }
}

/* Sidebar Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.sidebar-title {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--neutral-700);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.title-icon {
  font-size: var(--text-xl);
}

.sidebar-collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--neutral-500);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-collapse-btn:hover {
  background: var(--primary-50);
  color: var(--primary-600);
  transform: scale(1.05);
}

.collapse-icon {
  font-size: var(--text-sm);
}

/* Search Section */
.sidebar-search {
  position: relative;
  margin-bottom: var(--space-4);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-4) 0 var(--space-12);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  color: var(--neutral-700);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  color: var(--neutral-400);
  font-size: var(--text-lg);
  z-index: 1;
}

.search-clear {
  position: absolute;
  right: var(--space-3);
  width: 20px;
  height: 20px;
  border: none;
  background: var(--neutral-200);
  border-radius: 50%;
  color: var(--neutral-600);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.search-clear:hover {
  background: var(--error);
  color: white;
}

/* Category Groups */
.category-groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.category-button {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  text-align: left;
  width: 100%;
}

.left-sidebar.collapsed .category-button {
  justify-content: center;
  padding: var(--space-3);
}

.category-button:hover {
  background: var(--glass-bg);
  transform: translateX(4px);
}

.category-button.active {
  background: var(--primary-100);
  color: var(--primary-700);
  transform: translateX(8px);
}

.category-button.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--primary-500);
  border-radius: 0 2px 2px 0;
}

.category-icon {
  font-size: var(--text-xl);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.category-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.category-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--neutral-600);
  flex: 1;
}

.category-count {
  font-size: var(--text-xs);
  color: var(--neutral-400);
  background: var(--neutral-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-variant-numeric: tabular-nums;
  min-width: 24px;
  text-align: center;
}

.category-button.active .category-count {
  background: var(--primary-200);
  color: var(--primary-700);
}

/* Quick Stats (Collapsed) */
.quick-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--glass-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.stat-icon {
  font-size: var(--text-lg);
}

.stat-value {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--neutral-600);
}

/* Item Panel */
.item-panel {
  position: fixed;
  left: 280px;
  top: 72px;
  bottom: 48px;
  width: 320px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 0 var(--radius-2xl) var(--radius-2xl) 0;
  box-shadow: var(--shadow-2xl);
  z-index: 30;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.left-sidebar.collapsed + .item-panel,
.item-panel.open {
  transform: translateX(0);
}

.item-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--glass-border);
}

.item-panel-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.panel-icon {
  font-size: var(--text-xl);
}

.item-panel-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--glass-bg);
  color: var(--neutral-500);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-panel-close:hover {
  background: var(--error);
  color: white;
  transform: rotate(90deg);
}

.item-panel-content {
  flex: 1;
  padding: var(--space-4) var(--space-6);
  overflow-y: auto;
}

/* Item Filters */
.item-filters {
  margin-bottom: var(--space-4);
}

.filter-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  color: var(--neutral-700);
  font-size: var(--text-sm);
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.item-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.item-card:hover {
  background: var(--primary-50);
  border-color: var(--primary-200);
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-lg);
}

.item-card.selected {
  background: var(--primary-100);
  border-color: var(--primary-500);
  transform: translateY(-2px);
}

.item-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg) scale(0.9);
  z-index: 1000;
}

.item-icon {
  font-size: var(--text-2xl);
  text-align: center;
  margin-bottom: var(--space-2);
}

.item-info {
  flex: 1;
  text-align: center;
}

.item-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--neutral-700);
  margin-bottom: var(--space-1);
}

.item-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  margin-bottom: var(--space-2);
}

.item-cost {
  color: var(--accent-600);
  font-weight: var(--font-semibold);
}

.item-rarity {
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: var(--font-medium);
  text-transform: uppercase;
}

.item-rarity.common { background: var(--neutral-200); color: var(--neutral-700); }
.item-rarity.uncommon { background: var(--primary-200); color: var(--primary-700); }
.item-rarity.rare { background: var(--secondary-200); color: var(--secondary-700); }
.item-rarity.epic { background: var(--accent-200); color: var(--accent-700); }
.item-rarity.legendary { background: var(--warning); color: white; }

.item-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.item-card:hover .item-actions {
  opacity: 1;
}

.item-action-btn {
  flex: 1;
  padding: var(--space-1);
  border: none;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.item-action-btn:hover {
  background: var(--primary-500);
  color: white;
  transform: scale(1.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-8) var(--space-4);
  color: var(--neutral-500);
}

.empty-icon {
  font-size: var(--text-4xl);
  margin-bottom: var(--space-4);
}

.empty-message {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-2);
}

.empty-hint {
  font-size: var(--text-sm);
}

/* Panel Overlay (Mobile) */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 25;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .left-sidebar {
    position: fixed;
    left: 0;
    top: 64px;
    bottom: 56px;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 30;
  }
  
  .left-sidebar.open {
    transform: translateX(0);
  }
  
  .item-panel {
    left: 0;
    top: 64px;
    bottom: 56px;
    width: 100vw;
    border-radius: 0;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1200px) {
  .left-sidebar {
    width: 240px;
  }
  
  .left-sidebar.collapsed {
    width: 60px;
  }
  
  .item-panel {
    left: 240px;
    width: 280px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .sidebar-glow,
  .item-card,
  .category-button {
    animation: none;
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .category-button.active::before {
    background: currentColor;
  }
  
  .item-rarity {
    border: 1px solid currentColor;
  }
}
</style>