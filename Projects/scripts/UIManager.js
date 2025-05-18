const overlayBtns = document.querySelectorAll('.overlay-btn');
const itemPanel = document.getElementById('item-panel');
const panelHeader = itemPanel.querySelector('.overlay-item-panel-header');
const itemLists = itemPanel.querySelectorAll('.item-list');

let currentCategory = null;

export function init() {
    overlayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            if (itemPanel.classList.contains('visible') && currentCategory === category) {
                itemPanel.classList.remove('visible');

                overlayBtns.forEach(b => b.classList.remove('active'));
                currentCategory = null;
                return;
            }

            overlayBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            panelHeader.textContent = btn.textContent;
            // 모든 카테고리 숨김
            itemLists.forEach(list => {
                list.style.display = (list.dataset.category === category) ? 'flex' : 'none';
            });
            itemPanel.classList.add('visible');
            currentCategory = category;
        });
    });

    document.addEventListener('mousedown', e => {
        if (!itemPanel.contains(e.target) && ![...overlayBtns].includes(e.target)) {
            itemPanel.classList.remove('visible');
            overlayBtns.forEach(b => b.classList.remove('active'));
            currentCategory = null;
        }
    });

    initDrag();
}

function initDrag() {
    let isDragging = false, startX, startY, startLeft, startTop;
    
    panelHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        itemPanel.classList.add('dragging');
        const rect = itemPanel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        itemPanel.style.position = 'fixed';
        itemPanel.style.left = `${rect.left}px`;
        itemPanel.style.top = `${rect.top}px`;
        itemPanel.style.bottom = '';
        itemPanel.style.transform = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        itemPanel.style.left = `${startLeft + dx}px`;
        itemPanel.style.top = `${startTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            itemPanel.classList.remove('dragging');
        }
    });
}
