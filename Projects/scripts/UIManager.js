// UIManager.js
export class UIManager {
    constructor({ onItemDrop }) {
        this.overlayBtns = document.querySelectorAll('.overlay-btn');
        this.itemPanel = document.getElementById('item-panel');
        this.panelHeader = this.itemPanel.querySelector('.overlay-item-panel-header');
        this.itemList = document.getElementById('item-list');
        this.onItemDrop = onItemDrop;
    //all the cases are for the test runs ==================================================
        this.itemData = {
            props: [
                { icon: '🎩', label: 'Hat', type: 'hat' },
                { icon: '🧸', label: 'Toy', type: 'toy' }
            ],
            buildings: [
                { icon: '🏠', label: 'House', type: 'house' },
                { icon: '🏢', label: 'Office', type: 'office' }
            ],
            nature: [
                { icon: '🌳', label: 'Oak', type: 'oak' },
                { icon: '🌸', label: 'Flower', type: 'flower' }
            ],
            animals: [
                { icon: '🐄', label: 'Cow', type: 'cow' },
                { icon: '🐑', label: 'Sheep', type: 'sheep' }
            ]
        };

        this.currentCategory = null;
        this.init();
        this.initDrag();
    }
    //========================================================================

    init() {
        // 버튼 클릭 시 패널 슬라이드/카테고리 교체
        this.overlayBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                if (this.itemPanel.classList.contains('visible') && this.currentCategory === category) {
                    this.itemPanel.classList.remove('visible');
                    this.overlayBtns.forEach(b => b.classList.remove('active'));
                    this.currentCategory = null;
                    return;
                }

                if (this.itemPanel.classList.contains('visible')) {
                    // 접히는 애니메이션 후 교체
                    this.itemPanel.classList.remove('visible');
                    setTimeout(() => {
                        this.overlayBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.panelHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                        this.renderItems(category);
                        this.itemPanel.classList.add('visible');
                        this.currentCategory = category;
                    }, 400); // transition 시간과 맞추세요
                } else {
                    this.overlayBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.panelHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                    this.renderItems(category);
                    this.itemPanel.classList.add('visible');
                    this.currentCategory = category;
                }
            });
        });


        // 바깥 클릭 시 패널 닫기
        document.addEventListener('mousedown', e => {
            if (!this.itemPanel.contains(e.target) && ![...this.overlayBtns].includes(e.target)) {
                this.itemPanel.classList.remove('visible');
                this.overlayBtns.forEach(b => b.classList.remove('active'));
                this.currentCategory = null;
            }
        });

        // 드롭 처리
        const sceneContainer = document.getElementById('scene-container');
        sceneContainer.addEventListener('dragover', e => e.preventDefault());
        sceneContainer.addEventListener('drop', e => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            if (type && this.onItemDrop) {
                this.onItemDrop(type, e.clientX, e.clientY);
            }
            this.itemPanel.classList.remove('visible');
            this.overlayBtns.forEach(b => b.classList.remove('active'));
            this.currentCategory = null;
        });
    }

    renderItems(category) {
        this.itemList.innerHTML = '';
        (this.itemData[category] || []).forEach(item => {
            const div = document.createElement('div');
            div.className = 'draggable-item';
            div.draggable = true;
            div.innerHTML = `<span class="item-icon">${item.icon}</span><span>${item.label}</span>`;
            div.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', item.type);
            });
            this.itemList.appendChild(div);
        });
    }

    // 패널 헤더 드래그로 패널 이동
    initDrag() {
        let isDragging = false, startX, startY, startLeft, startTop;
        this.panelHeader.addEventListener('mousedown', (e) => {
            isDragging = true;
            this.itemPanel.classList.add('dragging');
            const rect = this.itemPanel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startLeft = rect.left;
            startTop = rect.top;
            this.itemPanel.style.position = 'fixed';
            this.itemPanel.style.left = `${rect.left}px`;
            this.itemPanel.style.top = `${rect.top}px`;
            this.itemPanel.style.bottom = '';
            this.itemPanel.style.transform = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            this.itemPanel.style.left = `${startLeft + dx}px`;
            this.itemPanel.style.top = `${startTop + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.itemPanel.classList.remove('dragging');
            }
        });
    }
}
