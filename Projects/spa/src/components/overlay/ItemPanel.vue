<template>
  <div class="item-panel" :class="{ open: isOpen, mobile: isMobile }" v-show="isOpen">
    <!-- Panel Header -->
    <div class="panel-header">
      <div class="panel-title">
        <i class="title-icon">{{ categoryData?.icon || '📦' }}</i>
        <span class="title-text">{{ categoryData?.label || 'Items' }}</span>
        <span class="item-count">({{ filteredItems.length }})</span>
      </div>
      <button class="panel-close" @click="closePanel" :title="'Close Panel'">
        <i>✕</i>
      </button>
    </div>
    
    <!-- Search & Filters -->
    <div class="panel-controls" v-if="filteredItems.length > 6">
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
      
      <div class="filter-controls">
        <select v-model="sortBy" class="sort-select">
          <option value="name">Sort by Name</option>
          <option value="cost">Sort by Cost</option>
          <option value="rarity">Sort by Rarity</option>
        </select>
        
        <select v-model="rarityFilter" class="rarity-filter">
          <option value="">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
        </select>
      </div>
    </div>
    
    <!-- Items Grid -->
    <div class="panel-content">
      <div class="items-grid" v-if="filteredItems.length > 0">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="item-card"
          :class="{
            selected: selectedItem === item.id,
            dragging: draggedItem === item.id,
            [`rarity-${item.rarity}`]: true
          }"
          @click="selectItem(item)"
          @dblclick="addItem(item)"
          @dragstart="startDrag(item, $event)"
          @dragend="endDrag"
          draggable="true"
          :title="item.description"
        >
          <!-- Item Icon -->
          <div class="item-icon">{{ item.icon }}</div>
          
          <!-- Item Info -->
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-meta">
              <span class="item-cost" v-if="item.cost">💰{{ item.cost }}</span>
              <span class="item-rarity" :class="`rarity-${item.rarity}`">
                {{ getRarityLabel(item.rarity) }}
              </span>
            </div>
          </div>
          
          <!-- Item Actions -->
          <div class="item-actions">
            <button class="item-action-btn add" @click.stop="addItem(item)" title="Add to Scene">
              ➕
            </button>
            <button class="item-action-btn info" @click.stop="showItemInfo(item)" title="Item Info">
              ℹ️
            </button>
          </div>
          
          <!-- Rarity Indicator -->
          <div class="rarity-indicator" :class="`rarity-${item.rarity}`"></div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="empty-icon">📭</i>
        <p class="empty-message">No items found</p>
        <p class="empty-hint" v-if="searchQuery">
          Try different search terms or clear filters
        </p>
        <p class="empty-hint" v-else>
          Select a category from the sidebar
        </p>
        <button v-if="searchQuery || rarityFilter" class="clear-filters-btn" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>
    
    <!-- Panel Footer -->
    <div class="panel-footer" v-if="selectedItem">
      <div class="selected-item-info">
        <div class="selected-icon">{{ getSelectedItemData()?.icon }}</div>
        <div class="selected-details">
          <div class="selected-name">{{ getSelectedItemData()?.name }}</div>
          <div class="selected-description">{{ getSelectedItemData()?.description }}</div>
        </div>
      </div>
      <div class="footer-actions">
        <button class="footer-btn primary" @click="addSelectedItem">
          Add to Scene
        </button>
        <button class="footer-btn secondary" @click="clearSelection">
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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
  items: Item[]
}

// Props
interface Props {
  isOpen?: boolean
  category?: string
  items?: Item[]
  categoryData?: Category
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  category: '',
  items: () => [],
  categoryData: undefined
})

// Emits
const emit = defineEmits<{
  'close': []
  'item-selected': [item: Item]
  'item-added': [item: Item]
  'item-info': [item: Item]
}>()

// Reactive state
const searchQuery = ref('')
const sortBy = ref('name')
const rarityFilter = ref('')
const selectedItem = ref<string | null>(null)
const draggedItem = ref<string | null>(null)
const isMobile = ref(false)

// Computed properties
const filteredItems = computed(() => {
  let items = props.items || []
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // Apply rarity filter
  if (rarityFilter.value) {
    items = items.filter(item => item.rarity === rarityFilter.value)
  }
  
  // Apply sorting
  items = [...items].sort((a, b) => {
    switch (sortBy.value) {
      case 'cost':
        return (a.cost || 0) - (b.cost || 0)
      case 'rarity':
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }
        return rarityOrder[b.rarity] - rarityOrder[a.rarity]
      default:
        return a.name.localeCompare(b.name)
    }
  })
  
  return items
})

// Methods
const closePanel = () => {
  emit('close')
}

const selectItem = (item: Item) => {
  selectedItem.value = selectedItem.value === item.id ? null : item.id
  if (selectedItem.value) {
    emit('item-selected', item)
  }
}

const addItem = (item: Item) => {
  emit('item-added', item)
  console.log('Adding item:', item.name)
}

const addSelectedItem = () => {
  const item = getSelectedItemData()
  if (item) {
    addItem(item)
  }
}

const showItemInfo = (item: Item) => {
  emit('item-info', item)
  console.log('Showing info for:', item.name)
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
}

const handleSearch = () => {
  // Search is reactive through computed property
}

const clearSearch = () => {
  searchQuery.value = ''
}

const clearFilters = () => {
  searchQuery.value = ''
  rarityFilter.value = ''
  sortBy.value = 'name'
}

const clearSelection = () => {
  selectedItem.value = null
}

const getSelectedItemData = (): Item | undefined => {
  return filteredItems.value.find(item => item.id === selectedItem.value)
}

const getRarityLabel = (rarity: string): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Watch for prop changes
watch(() => props.category, () => {
  // Clear selection when category changes
  selectedItem.value = null
  searchQuery.value = ''
  rarityFilter.value = ''
})

watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    selectedItem.value = null
  }
})
</script>

<style scoped>
/* Item Panel Styles */
.item-panel {
  position: fixed;
  top: 72px;
  bottom: 48px;
  left: 280px;
  width: 350px;
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 0 var(--radius-2xl) var(--radius-2xl) 0;
  box-shadow: var(--shadow-2xl);
  z-index: 25;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-panel.open {
  transform: translateX(0);
}

.item-panel.mobile {
  left: 0;
  top: 64px;
  bottom: 56px;
  width: 100vw;
  border-radius: 0;
}

/* Panel Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg-strong);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.title-icon {
  font-size: var(--text-2xl);
}

.title-text {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.item-count {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
}

.panel-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  border: none;
  background: var(--glass-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-close:hover {
  background: var(--error);
  color: white;
  transform: rotate(90deg) scale(1.1);
}

/* Panel Controls */
.panel-controls {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  color: var(--text-quaternary);
  font-size: var(--text-base);
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-10) 0 var(--space-10);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-xl);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all var(--transition-base);
}

.search-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.search-clear {
  position: absolute;
  right: var(--space-3);
  width: 20px;
  height: 20px;
  border: none;
  background: var(--bg-surface-hover);
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.search-clear:hover {
  background: var(--error);
  color: white;
  transform: scale(1.1);
}

.filter-controls {
  display: flex;
  gap: var(--space-2);
}

.sort-select,
.rarity-filter {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
}

/* Panel Content */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-6);
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
}

.item-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  background: var(--bg-surface);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
  min-height: 120px;
}

.item-card:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-focus);
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-lg);
}

.item-card.selected {
  background: var(--primary-50);
  border-color: var(--primary-500);
  transform: translateY(-2px);
}

.item-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg) scale(0.9);
  z-index: 1000;
}

/* Rarity-specific styling */
.item-card.rarity-common { border-left-color: var(--neutral-400); }
.item-card.rarity-uncommon { border-left-color: var(--primary-400); }
.item-card.rarity-rare { border-left-color: var(--secondary-400); }
.item-card.rarity-epic { border-left-color: var(--accent-400); }
.item-card.rarity-legendary { border-left-color: var(--warning); }

.item-icon {
  font-size: var(--text-3xl);
  text-align: center;
  margin-bottom: var(--space-2);
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  text-align: center;
  margin-bottom: var(--space-2);
}

.item-name {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
  line-height: 1.2;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  gap: var(--space-1);
}

.item-cost {
  color: var(--accent-600);
  font-weight: var(--font-semibold);
}

.item-rarity {
  padding: 1px 6px;
  border-radius: var(--radius-full);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  font-size: 10px;
}

.item-rarity.rarity-common { background: var(--neutral-200); color: var(--neutral-700); }
.item-rarity.rarity-uncommon { background: var(--primary-200); color: var(--primary-700); }
.item-rarity.rarity-rare { background: var(--secondary-200); color: var(--secondary-700); }
.item-rarity.rarity-epic { background: var(--accent-200); color: var(--accent-700); }
.item-rarity.rarity-legendary { background: var(--warning); color: white; }

.item-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-base);
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
  transition: all var(--transition-base);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-action-btn.add:hover {
  background: var(--primary-500);
  color: white;
  transform: scale(1.1);
}

.item-action-btn.info:hover {
  background: var(--secondary-500);
  color: white;
  transform: scale(1.1);
}

.rarity-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  opacity: 0.6;
}

.rarity-indicator.rarity-common { background: var(--neutral-400); }
.rarity-indicator.rarity-uncommon { background: var(--primary-400); }
.rarity-indicator.rarity-rare { background: var(--secondary-400); }
.rarity-indicator.rarity-epic { background: var(--accent-400); }
.rarity-indicator.rarity-legendary { background: var(--warning); }

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: var(--text-5xl);
  margin-bottom: var(--space-4);
}

.empty-message {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
}

.empty-hint {
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.clear-filters-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.clear-filters-btn:hover {
  background: var(--primary-500);
  color: white;
  border-color: var(--primary-500);
}

/* Panel Footer */
.panel-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--glass-border);
  background: var(--glass-bg-strong);
  display: flex;
  gap: var(--space-4);
}

.selected-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.selected-icon {
  font-size: var(--text-2xl);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-100);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.selected-details {
  flex: 1;
  min-width: 0;
}

.selected-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: 2px;
}

.selected-description {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.footer-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.footer-btn.primary {
  background: var(--primary-500);
  color: white;
  border-color: var(--primary-500);
}

.footer-btn.primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
}

.footer-btn.secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.footer-btn.secondary:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-focus);
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .item-panel {
    left: 240px;
    width: 320px;
  }
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .panel-footer {
    flex-direction: column;
    gap: var(--space-3);
  }
  
  .footer-actions {
    justify-content: stretch;
  }
  
  .footer-btn {
    flex: 1;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .item-card,
  .panel-close,
  .item-action-btn {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .item-card {
    border-width: 3px;
  }
  
  .item-rarity {
    border: 1px solid currentColor;
  }
}
</style>