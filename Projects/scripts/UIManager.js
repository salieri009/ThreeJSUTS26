export class UIManager {
    constructor({ onItemDrop }) {
        this.itemData = {
            animals: [
                { icon: '🌲', label: 'Tree', type: 'tree' },
                { icon: '🪑', label: 'Chair', type: 'chair' },
                { icon: '🗿', label: 'Statue', type: 'statue' }
            ],
            buildings: [
                { icon: '🏠', label: 'House', type: 'house' },
                { icon: '🏢', label: 'Office', type: 'office' }
            ],
            nature: [
                { icon: '🌳', label: 'Oak', type: 'oak' },
                { icon: '🌸', label: 'Flower', type: 'flower' }
            ]
        };

        this.overlayBtns = document.querySelectorAll('.overlay-btn');
        this.itemPanel = document.getElementById('item-panel');
        this.sceneContainer = document.getElementById('scene-container');
        this.onItemDrop = onItemDrop;
    //initialisation

        this.init();
    }

    init() {
        // Button click event to toggle item categories
        this.overlayBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.overlayBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                this.renderItemPanel(category);
            });
        });

        // Handle dragover and drop in the scene
        this.sceneContainer.addEventListener('dragover', e => e.preventDefault());
        this.sceneContainer.addEventListener('drop', e => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            if (type && this.onItemDrop) {
                this.onItemDrop(type, e.clientX, e.clientY);
            }
            // Hide the panel and reset button states after drop
            this.itemPanel.classList.remove('visible');
            this.overlayBtns.forEach(b => b.classList.remove('active'));
        });

        // Close panel when clicking outside
        document.addEventListener('click', e => {
            if (!this.itemPanel.contains(e.target) && ![...this.overlayBtns].includes(e.target)) {
                this.itemPanel.classList.remove('visible');
                this.overlayBtns.forEach(b => b.classList.remove('active'));
            }
        });
    }

    renderItemPanel(category) {
        this.itemPanel.innerHTML = ''; // Clear previous items
        this.itemData[category].forEach(item => {
            const div = document.createElement('div');
            div.className = 'draggable-item';
            div.draggable = true;
            div.dataset.type = item.type;
            div.innerHTML = `<span class="item-icon">${item.icon}</span><span>${item.label}</span>`;

            // Dragstart event to store the item type when dragging
            div.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', item.type);
            });

            this.itemPanel.appendChild(div);
        });

        // Make the item panel visible when rendering items
        this.itemPanel.classList.add('visible');
    }
}
