// build/UIManager.js

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

        this.init();
    }

    init() {
        this.overlayBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.overlayBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                this.renderItemPanel(category);
            });
        });

        this.sceneContainer.addEventListener('dragover', e => e.preventDefault());
        this.sceneContainer.addEventListener('drop', e => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            if (type && this.onItemDrop) {
                this.onItemDrop(type, e.clientX, e.clientY);
            }
            this.itemPanel.classList.remove('visible');
            this.overlayBtns.forEach(b => b.classList.remove('active'));
        });

        // 바깥 클릭 시 패널 닫기
        document.addEventListener('click', e => {
            if (!this.itemPanel.contains(e.target) && ![...this.overlayBtns].includes(e.target)) {
                this.itemPanel.classList.remove('visible');
                this.overlayBtns.forEach(b => b.classList.remove('active'));
            }
        });
    }

    renderItemPanel(category) {
        this.itemPanel.innerHTML = '';
        this.itemData[category].forEach(item => {
            const div = document.createElement('div');
            div.className = 'draggable-item';
            div.draggable = true;
            div.dataset.type = item.type;
            div.innerHTML = `<span class="item-icon">${item.icon}</span><span>${item.label}</span>`;
            div.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', item.type);
            });
            this.itemPanel.appendChild(div);
        });
        this.itemPanel.classList.add('visible');
    }
}
