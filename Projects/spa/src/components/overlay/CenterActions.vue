<template>
  <div class="center-actions" :class="{ visible: isVisible, expanded: isExpanded }" v-show="isVisible">
    <!-- Main Action Group -->
    <div class="main-action-group">
      <button
        class="main-action-btn add"
        @click="handleAddAction"
        @mouseenter="showTooltip('add')"
        @mouseleave="hideTooltip"
        :disabled="isProcessing"
        title="Add Item (Space)"
      >
        <i class="action-icon">➕</i>
        <div class="action-tooltip" v-if="activeTooltip === 'add'">
          Add Item
          <span class="shortcut-hint">Space</span>
        </div>
      </button>
      
      <button
        class="main-action-btn remove"
        @click="handleRemoveAction"
        @mouseenter="showTooltip('remove')"
        @mouseleave="hideTooltip"
        :disabled="isProcessing || !hasSelection"
        title="Remove Item (Delete)"
      >
        <i class="action-icon">❌</i>
        <div class="action-tooltip" v-if="activeTooltip === 'remove'">
          Remove Item
          <span class="shortcut-hint">Del</span>
        </div>
      </button>
      
      <!-- Expand Toggle -->
      <button
        class="expand-toggle-btn"
        @click="toggleExpanded"
        @mouseenter="showTooltip('expand')"
        @mouseleave="hideTooltip"
        title="More Actions"
      >
        <i class="expand-icon">{{ isExpanded ? '◀' : '▶' }}</i>
        <div class="action-tooltip" v-if="activeTooltip === 'expand'">
          {{ isExpanded ? 'Less Actions' : 'More Actions' }}
        </div>
      </button>
    </div>
    
    <!-- Secondary Actions (Expandable) -->
    <Transition name="secondary-actions" appear>
      <div class="secondary-actions" v-if="isExpanded">
        <button
          class="secondary-action-btn"
          @click="handleCopyAction"
          @mouseenter="showTooltip('copy')"
          @mouseleave="hideTooltip"
          :disabled="!hasSelection"
          title="Copy (Ctrl+C)"
        >
          <i class="action-icon">📋</i>
          <div class="action-tooltip" v-if="activeTooltip === 'copy'">
            Copy
            <span class="shortcut-hint">Ctrl+C</span>
          </div>
        </button>
        
        <button
          class="secondary-action-btn"
          @click="handlePasteAction"
          @mouseenter="showTooltip('paste')"
          @mouseleave="hideTooltip"
          :disabled="!hasClipboard"
          title="Paste (Ctrl+V)"
        >
          <i class="action-icon">📄</i>
          <div class="action-tooltip" v-if="activeTooltip === 'paste'">
            Paste
            <span class="shortcut-hint">Ctrl+V</span>
          </div>
        </button>
        
        <button
          class="secondary-action-btn"
          @click="handleRotateAction"
          @mouseenter="showTooltip('rotate')"
          @mouseleave="hideTooltip"
          :disabled="!hasSelection"
          title="Rotate (R)"
        >
          <i class="action-icon">🔄</i>
          <div class="action-tooltip" v-if="activeTooltip === 'rotate'">
            Rotate
            <span class="shortcut-hint">R</span>
          </div>
        </button>
        
        <button
          class="secondary-action-btn"
          @click="handleDuplicateAction"
          @mouseenter="showTooltip('duplicate')"
          @mouseleave="hideTooltip"
          :disabled="!hasSelection"
          title="Duplicate (Ctrl+D)"
        >
          <i class="action-icon">📑</i>
          <div class="action-tooltip" v-if="activeTooltip === 'duplicate'">
            Duplicate
            <span class="shortcut-hint">Ctrl+D</span>
          </div>
        </button>
        
        <button
          class="secondary-action-btn"
          @click="handleInfoAction"
          @mouseenter="showTooltip('info')"
          @mouseleave="hideTooltip"
          :disabled="!hasSelection"
          title="Info (I)"
        >
          <i class="action-icon">ℹ️</i>
          <div class="action-tooltip" v-if="activeTooltip === 'info'">
            Info
            <span class="shortcut-hint">I</span>
          </div>
        </button>
        
        <button
          class="secondary-action-btn"
          @click="handleUndoAction"
          @mouseenter="showTooltip('undo')"
          @mouseleave="hideTooltip"
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
        >
          <i class="action-icon">↶</i>
          <div class="action-tooltip" v-if="activeTooltip === 'undo'">
            Undo
            <span class="shortcut-hint">Ctrl+Z</span>
          </div>
        </button>
      </div>
    </Transition>
    
    <!-- Action Feedback -->
    <Transition name="feedback" appear>
      <div class="action-feedback" v-if="feedbackMessage">
        <div class="feedback-content" :class="feedbackType">
          <i class="feedback-icon">{{ getFeedbackIcon(feedbackType) }}</i>
          <span class="feedback-text">{{ feedbackMessage }}</span>
        </div>
      </div>
    </Transition>
    
    <!-- Selection Info -->
    <Transition name="selection-info" appear>
      <div class="selection-info" v-if="hasSelection && selectedItem">
        <div class="selection-content">
          <div class="selection-icon">{{ selectedItem.icon }}</div>
          <div class="selection-details">
            <div class="selection-name">{{ selectedItem.name }}</div>
            <div class="selection-type">{{ selectedItem.category }}</div>
          </div>
          <div class="selection-actions">
            <button class="selection-action" @click="handleMoveAction" title="Move Mode">
              <i>🚚</i>
            </button>
            <button class="selection-action" @click="handleEditAction" title="Edit Properties">
              <i>✏️</i>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Types
interface SelectedItem {
  id: string
  name: string
  icon: string
  category: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}

interface ActionHistory {
  action: string
  data: any
  timestamp: number
}

// Props
interface Props {
  visible?: boolean
  selectedItem?: SelectedItem | null
  canUndo?: boolean
  canRedo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  selectedItem: null,
  canUndo: false,
  canRedo: false
})

// Emits
const emit = defineEmits<{
  'add-item': []
  'remove-item': [item: SelectedItem]
  'copy-item': [item: SelectedItem]
  'paste-item': []
  'rotate-item': [item: SelectedItem]
  'duplicate-item': [item: SelectedItem]
  'show-info': [item: SelectedItem]
  'undo-action': []
  'redo-action': []
  'move-item': [item: SelectedItem]
  'edit-item': [item: SelectedItem]
}>()

// Reactive state
const isVisible = ref(props.visible)
const isExpanded = ref(false)
const isProcessing = ref(false)
const activeTooltip = ref<string | null>(null)
const hasClipboard = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error' | 'info' | 'warning'>('info')

// Action history for undo/redo
const actionHistory = ref<ActionHistory[]>([])
const currentHistoryIndex = ref(-1)

// Computed properties
const hasSelection = computed(() => !!props.selectedItem)

// Auto-hide expanded state after inactivity
let expandTimeout: number | null = null
const AUTO_COLLAPSE_DELAY = 5000 // 5 seconds

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  
  if (isExpanded.value) {
    // Auto-collapse after delay
    if (expandTimeout) clearTimeout(expandTimeout)
    expandTimeout = setTimeout(() => {
      isExpanded.value = false
    }, AUTO_COLLAPSE_DELAY)
  } else {
    if (expandTimeout) clearTimeout(expandTimeout)
  }
}

const showTooltip = (action: string) => {
  activeTooltip.value = action
}

const hideTooltip = () => {
  activeTooltip.value = null
}

const showFeedback = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  feedbackMessage.value = message
  feedbackType.value = type
  
  // Auto-hide feedback after 3 seconds
  setTimeout(() => {
    feedbackMessage.value = ''
  }, 3000)
}

const getFeedbackIcon = (type: string): string => {
  switch (type) {
    case 'success': return '✅'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    default: return 'ℹ️'
  }
}

const addToHistory = (action: string, data: any) => {
  const historyItem: ActionHistory = {
    action,
    data,
    timestamp: Date.now()
  }
  
  // Remove any history after current index (for redo functionality)
  actionHistory.value = actionHistory.value.slice(0, currentHistoryIndex.value + 1)
  
  // Add new action
  actionHistory.value.push(historyItem)
  currentHistoryIndex.value = actionHistory.value.length - 1
  
  // Limit history size
  if (actionHistory.value.length > 50) {
    actionHistory.value.shift()
    currentHistoryIndex.value--
  }
}

// Action handlers
const handleAddAction = async () => {
  if (isProcessing.value) return
  
  isProcessing.value = true
  
  try {
    emit('add-item')
    showFeedback('Ready to add item. Click on the scene or select from sidebar.', 'info')
    addToHistory('add', null)
  } catch (error) {
    showFeedback('Failed to initiate add action', 'error')
    console.error('Add action failed:', error)
  } finally {
    isProcessing.value = false
  }
}

const handleRemoveAction = async () => {
  if (isProcessing.value || !props.selectedItem) return
  
  isProcessing.value = true
  
  try {
    const itemToRemove = props.selectedItem
    emit('remove-item', itemToRemove)
    showFeedback(`${itemToRemove.name} removed from scene`, 'success')
    addToHistory('remove', itemToRemove)
  } catch (error) {
    showFeedback('Failed to remove item', 'error')
    console.error('Remove action failed:', error)
  } finally {
    isProcessing.value = false
  }
}

const handleCopyAction = () => {
  if (!props.selectedItem) return
  
  try {
    emit('copy-item', props.selectedItem)
    hasClipboard.value = true
    showFeedback(`${props.selectedItem.name} copied to clipboard`, 'success')
    addToHistory('copy', props.selectedItem)
  } catch (error) {
    showFeedback('Failed to copy item', 'error')
    console.error('Copy action failed:', error)
  }
}

const handlePasteAction = () => {
  if (!hasClipboard.value) return
  
  try {
    emit('paste-item')
    showFeedback('Item pasted from clipboard', 'success')
    addToHistory('paste', null)
  } catch (error) {
    showFeedback('Failed to paste item', 'error')
    console.error('Paste action failed:', error)
  }
}

const handleRotateAction = () => {
  if (!props.selectedItem) return
  
  try {
    emit('rotate-item', props.selectedItem)
    showFeedback(`${props.selectedItem.name} rotated`, 'success')
    addToHistory('rotate', props.selectedItem)
  } catch (error) {
    showFeedback('Failed to rotate item', 'error')
    console.error('Rotate action failed:', error)
  }
}

const handleDuplicateAction = () => {
  if (!props.selectedItem) return
  
  try {
    emit('duplicate-item', props.selectedItem)
    showFeedback(`${props.selectedItem.name} duplicated`, 'success')
    addToHistory('duplicate', props.selectedItem)
  } catch (error) {
    showFeedback('Failed to duplicate item', 'error')
    console.error('Duplicate action failed:', error)
  }
}

const handleInfoAction = () => {
  if (!props.selectedItem) return
  
  try {
    emit('show-info', props.selectedItem)
    showFeedback(`Showing info for ${props.selectedItem.name}`, 'info')
  } catch (error) {
    showFeedback('Failed to show item info', 'error')
    console.error('Info action failed:', error)
  }
}

const handleUndoAction = () => {
  if (!props.canUndo) return
  
  try {
    emit('undo-action')
    showFeedback('Action undone', 'info')
  } catch (error) {
    showFeedback('Failed to undo action', 'error')
    console.error('Undo action failed:', error)
  }
}

const handleMoveAction = () => {
  if (!props.selectedItem) return
  
  try {
    emit('move-item', props.selectedItem)
    showFeedback(`Move mode activated for ${props.selectedItem.name}`, 'info')
  } catch (error) {
    showFeedback('Failed to activate move mode', 'error')
    console.error('Move action failed:', error)
  }
}

const handleEditAction = () => {
  if (!props.selectedItem) return
  
  try {
    emit('edit-item', props.selectedItem)
    showFeedback(`Editing ${props.selectedItem.name}`, 'info')
  } catch (error) {
    showFeedback('Failed to open edit mode', 'error')
    console.error('Edit action failed:', error)
  }
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Don't handle shortcuts if user is typing in an input
  if ((event.target as HTMLElement)?.tagName === 'INPUT') return
  
  switch (event.code) {
    case 'Space':
      event.preventDefault()
      handleAddAction()
      break
      
    case 'Delete':
    case 'Backspace':
      if (hasSelection.value) {
        event.preventDefault()
        handleRemoveAction()
      }
      break
      
    case 'KeyR':
      if (!event.ctrlKey && !event.metaKey && hasSelection.value) {
        event.preventDefault()
        handleRotateAction()
      }
      break
      
    case 'KeyI':
      if (!event.ctrlKey && !event.metaKey && hasSelection.value) {
        event.preventDefault()
        handleInfoAction()
      }
      break
      
    case 'KeyC':
      if ((event.ctrlKey || event.metaKey) && hasSelection.value) {
        event.preventDefault()
        handleCopyAction()
      }
      break
      
    case 'KeyV':
      if ((event.ctrlKey || event.metaKey) && hasClipboard.value) {
        event.preventDefault()
        handlePasteAction()
      }
      break
      
    case 'KeyD':
      if ((event.ctrlKey || event.metaKey) && hasSelection.value) {
        event.preventDefault()
        handleDuplicateAction()
      }
      break
      
    case 'KeyZ':
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && props.canUndo) {
        event.preventDefault()
        handleUndoAction()
      }
      break
      
    case 'Escape':
      if (isExpanded.value) {
        event.preventDefault()
        isExpanded.value = false
      }
      break
  }
}

// Auto-show/hide based on context
const updateVisibility = () => {
  // Show actions when there's interaction or selection
  if (hasSelection.value || isExpanded.value) {
    isVisible.value = true
  }
  
  // Auto-hide after inactivity (could be enhanced with mouse tracking)
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  console.log('CenterActions initialized')
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (expandTimeout) clearTimeout(expandTimeout)
})

// Watch for prop changes
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

watch(() => props.selectedItem, () => {
  updateVisibility()
})

// Reset expanded state when selection changes
watch(hasSelection, (newValue) => {
  if (!newValue && isExpanded.value) {
    isExpanded.value = false
  }
})
</script>

<style scoped>
/* Center Actions Styles */
.center-actions {
  position: fixed;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  z-index: 20;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.center-actions.visible {
  pointer-events: auto;
  opacity: 1;
}

/* Main Action Group */
.main-action-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  padding: var(--space-2);
  box-shadow: var(--shadow-2xl);
  position: relative;
  overflow: hidden;
}

.main-action-group::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-500), transparent);
  opacity: 0.6;
}

.main-action-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--glass-bg);
  color: var(--neutral-600);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
}

.main-action-btn:hover:not(:disabled) {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.main-action-btn:active:not(:disabled) {
  transform: scale(0.95) rotate(-5deg);
}

.main-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.main-action-btn.add {
  background: var(--primary-100);
  color: var(--primary-600);
}

.main-action-btn.add:hover:not(:disabled) {
  background: var(--primary-500);
  color: white;
  animation: add-pulse 0.6s ease;
}

@keyframes add-pulse {
  0%, 100% { transform: scale(1.1) rotate(5deg); }
  50% { transform: scale(1.2) rotate(0deg); }
}

.main-action-btn.remove {
  background: var(--error-100);
  color: var(--error-600);
}

.main-action-btn.remove:hover:not(:disabled) {
  background: var(--error);
  color: white;
  animation: remove-shake 0.6s ease;
}

@keyframes remove-shake {
  0%, 100% { transform: scale(1.1) rotate(5deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
}

.expand-toggle-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--neutral-500);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
}

.expand-toggle-btn:hover {
  background: var(--secondary-100);
  color: var(--secondary-600);
  transform: scale(1.1);
}

.expand-icon {
  transition: transform 0.2s ease;
}

.center-actions.expanded .expand-icon {
  transform: rotate(180deg);
}

/* Secondary Actions */
.secondary-actions {
  display: flex;
  gap: var(--space-2);
}

.secondary-action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  color: var(--neutral-600);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
}

.secondary-action-btn:hover:not(:disabled) {
  background: var(--secondary-100);
  color: var(--secondary-600);
  border-color: var(--secondary-300);
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-lg);
}

.secondary-action-btn:active:not(:disabled) {
  transform: translateY(0) scale(1);
}

.secondary-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tooltips */
.action-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--neutral-900);
  color: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
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

.shortcut-hint {
  font-size: 10px;
  color: var(--neutral-400);
  margin-left: var(--space-1);
  background: var(--neutral-700);
  padding: 1px 4px;
  border-radius: 2px;
}

/* Action Feedback */
.action-feedback {
  position: fixed;
  bottom: var(--space-16);
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
}

.feedback-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.feedback-content.success {
  background: var(--success-100);
  color: var(--success-700);
  border-color: var(--success-300);
}

.feedback-content.error {
  background: var(--error-100);
  color: var(--error-700);
  border-color: var(--error-300);
}

.feedback-content.warning {
  background: var(--warning-100);
  color: var(--warning-700);
  border-color: var(--warning-300);
}

.feedback-content.info {
  background: var(--info-100);
  color: var(--info-700);
  border-color: var(--info-300);
}

.feedback-icon {
  font-size: var(--text-base);
}

/* Selection Info */
.selection-info {
  position: fixed;
  bottom: var(--space-20);
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
}

.selection-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  min-width: 200px;
}

.selection-icon {
  font-size: var(--text-2xl);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-100);
  border-radius: var(--radius-lg);
}

.selection-details {
  flex: 1;
}

.selection-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
}

.selection-type {
  font-size: var(--text-xs);
  color: var(--neutral-500);
  text-transform: capitalize;
}

.selection-actions {
  display: flex;
  gap: var(--space-1);
}

.selection-action {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--glass-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.selection-action:hover {
  background: var(--primary-100);
  transform: scale(1.1);
}

/* Transitions */
.secondary-actions-enter-active,
.secondary-actions-leave-active {
  transition: all 0.3s ease;
}

.secondary-actions-enter-from,
.secondary-actions-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

.feedback-enter-active,
.feedback-leave-active {
  transition: all 0.3s ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.9);
}

.selection-info-enter-active,
.selection-info-leave-active {
  transition: all 0.3s ease;
}

.selection-info-enter-from,
.selection-info-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.95);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .center-actions {
    bottom: var(--space-20); /* Account for mobile footer */
    gap: var(--space-2);
  }
  
  .main-action-btn {
    width: 48px;
    height: 48px;
    font-size: var(--text-lg);
  }
  
  .secondary-action-btn {
    width: 40px;
    height: 40px;
    font-size: var(--text-sm);
  }
  
  .expand-toggle-btn {
    width: 28px;
    height: 28px;
  }
  
  .selection-content {
    min-width: 150px;
    padding: var(--space-2) var(--space-3);
  }
  
  .selection-icon {
    width: 32px;
    height: 32px;
    font-size: var(--text-xl);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .main-action-btn,
  .secondary-action-btn,
  .expand-toggle-btn {
    transition: none;
    animation: none;
  }
  
  .add-pulse,
  .remove-shake {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .main-action-group,
  .secondary-action-btn,
  .feedback-content,
  .selection-content {
    border-width: 2px;
  }
  
  .main-action-btn.add {
    background: var(--success);
    color: white;
  }
  
  .main-action-btn.remove {
    background: var(--error);
    color: white;
  }
}

/* Dark theme adjustments */
[data-theme="dark"] .action-tooltip {
  background: var(--neutral-100);
  color: var(--neutral-900);
}

[data-theme="dark"] .action-tooltip::after {
  border-top-color: var(--neutral-100);
}
</style>