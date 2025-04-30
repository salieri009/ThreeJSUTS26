// UIManager.js - Updated with selection menu functionality

export default class UIManager {
    constructor(sceneManager) {
        // Store reference to SceneManager for communication
        this.sceneManager = sceneManager;

        // Keep original resource management code
        this.resources = {
            wood: 0, stone: 0, gold: 0
        };
        this.perSecond = {
            wood: 0, stone: 0, gold: 0
        };
        this.upgrades = {
            clickPower: 1, autoWood: 0
        };

        // Initialize UI interactions
        this.initSelectionMenus();

        // Original methods (kept for compatibility)
        this.bindEvents();
        this.startResourceLoop();
    }

    // New method to initialize selection menus
    initSelectionMenus() {
        // Get all add buttons in the interface
        const addButtons = document.querySelectorAll('.add-button');

        // Add click event listeners to all "+" buttons
        addButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                // Prevent event bubbling
                event.stopPropagation();

                // Determine which panel the button belongs to
                // (left sidebar or right properties panel)
                const isLeftPanel = button.closest('#build-panel') !== null;

                // Show appropriate selection menu
                if (isLeftPanel) {
                    this.showCategoryMenu(button);
                } else {
                    // Handle right panel "+" button if needed
                    this.showPropertyMenu(button);
                }
            });
        });

        // Close menus when clicking elsewhere
        document.addEventListener('click', () => {
            this.closeAllMenus();
        });
    }

    // Show category selection menu (Building/Animal)
    showCategoryMenu(button) {
        // Close any existing menus first
        this.closeAllMenus();

        // Create category selection menu
        const menuEl = document.createElement('div');
        menuEl.className = 'selection-menu category-menu';
        menuEl.innerHTML = `
            <div class="menu-item" data-category="building">🏠 Add Building</div>
            <div class="menu-item" data-category="animal">🐄 Add Animal</div>
     g   `;

        // Position menu near the button
        this.positionMenuNearElement(menuEl, button);

        // Add event listeners to menu items
        menuEl.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                const category = item.getAttribute('data-category');
                if (category === 'animal') {
                    this.showAnimalSubmenu(button);
                } else if (category === 'building') {
                    this.showBuildingSubmenu(button);
                }
            });
        });

        // Add to DOM
        document.body.appendChild(menuEl);
    }

    // Show animal selection submenu
    showAnimalSubmenu(button) {
        // Close previous menus
        this.closeAllMenus();

        // Create animal selection menu
        const menuEl = document.createElement('div');
        menuEl.className = 'selection-menu animal-menu';
        menuEl.innerHTML = `
            <div class="menu-item" data-animal="chicken">🐔 Chicken</div>
            <div class="menu-item" data-animal="pig">🐖 Pig</div>
            <div class="menu-item" data-animal="cow">🐄 Cow</div>
        `;

        // Position menu near the button
        this.positionMenuNearElement(menuEl, button);

        // Add event listeners to animal items
        menuEl.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                const animalType = item.getAttribute('data-animal');

                // Send selected animal to SceneManager
                this.addAnimalToScene(animalType);

                // Close menu after selection
                this.closeAllMenus();
            });
        });

        // Add to DOM
        document.body.appendChild(menuEl);
    }

    // Building submenu (example implementation)
    showBuildingSubmenu(button) {
        // Similar to animal submenu but with building types
        const menuEl = document.createElement('div');
        menuEl.className = 'selection-menu building-menu';
        menuEl.innerHTML = `
            <div class="menu-item" data-building="house">🏠 House</div>
            <div class="menu-item" data-building="barn">🏚️ Barn</div>
            <div class="menu-item" data-building="silo">🏗️ Silo</div>
        `;

        this.positionMenuNearElement(menuEl, button);

        menuEl.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                const buildingType = item.getAttribute('data-building');
                this.addBuildingToScene(buildingType);
                this.closeAllMenus();
            });
        });

        document.body.appendChild(menuEl);
    }

    // Property menu for right sidebar
    showPropertyMenu(button) {
        const menuEl = document.createElement('div');
        menuEl.className = 'selection-menu property-menu';
        menuEl.innerHTML = `
            <div class="menu-item" data-property="material">Material</div>
            <div class="menu-item" data-property="texture">Texture</div>
        `;

        this.positionMenuNearElement(menuEl, button);

        menuEl.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                const propertyType = item.getAttribute('data-property');
                // Handle property addition
                this.closeAllMenus();
            });
        });

        document.body.appendChild(menuEl);
    }

    // Helper to position menus
    positionMenuNearElement(menuEl, targetEl) {
        const rect = targetEl.getBoundingClientRect();

        // Default positioning
        menuEl.style.position = 'fixed';
        menuEl.style.zIndex = '1000';

        // Position to the right of the target element
        menuEl.style.left = `${rect.right + 5}px`;
        menuEl.style.top = `${rect.top}px`;

        // Ensure menu stays within viewport
        setTimeout(() => {
            const menuRect = menuEl.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
                // Position to the left if not enough space on right
                menuEl.style.left = `${rect.left - menuRect.width - 5}px`;
            }
            if (menuRect.bottom > window.innerHeight) {
                // Position above if not enough space below
                menuEl.style.top = `${rect.bottom - menuRect.height}px`;
            }
        }, 0);
    }

    // Close all open selection menus
    closeAllMenus() {
        document.querySelectorAll('.selection-menu').forEach(menu => {
            menu.remove();
        });
    }

    // Add selected animal to ThreeJS scene
    addAnimalToScene(animalType) {
        // Communication with SceneManager
        if (this.sceneManager) {
            // Communicate with SceneManager - actual implementation depends on your SceneManager interface
            this.sceneManager.addAnimal(animalType);

            // Show confirmation message
            this.showMessage(`${this.capitalizeFirstLetter(animalType)} added to scene!`);

            // Optional: Update resources if needed
            const costs = {
                'chicken': { wood: 20 },
                'pig': { wood: 50, stone: 10 },
                'cow': { wood: 100, stone: 20 }
            };

            if (costs[animalType]) {
                // Deduct resources if you want to implement cost
                // this.deductResources(costs[animalType]);
            }
        } else {
            console.error("SceneManager not initialized in UIManager");
        }
    }

    // Add selected building to ThreeJS scene
    addBuildingToScene(buildingType) {
        if (this.sceneManager) {
            this.sceneManager.addBuilding(buildingType);
            this.showMessage(`${this.capitalizeFirstLetter(buildingType)} added to scene!`);
        }
    }

    // Helper method
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Keep original methods for compatibility
    createUI() { /* Original code */ }
    bindEvents() { /* Original code */ }
    startResourceLoop() { /* Original code */ }
    updateUI() { /* Original code */ }
    showMessage(msg) {
        // Use existing method or create a new one if it doesn't exist
        this.messagePanel = this.messagePanel || document.querySelector('#message-panel');
        if (this.messagePanel) {
            this.messagePanel.textContent = msg;
            setTimeout(() => {
                if (this.messagePanel.textContent === msg) this.messagePanel.textContent = "";
            }, 2000);
        } else {
            // Fallback notification
            const notif = document.createElement('div');
            notif.className = 'floating-message';
            notif.textContent = msg;
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 2000);
        }
    }
    showFloatingText(text, targetEl, color="#fff") { /* Original code */ }
}
