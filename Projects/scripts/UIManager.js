const overlayBtns = document.querySelectorAll('.overlay-btn');
const itemPanel = document.getElementById('item-panel');
const panelHeader = itemPanel.querySelector('.overlay-item-panel-header');
const itemList = document.getElementById('item-list');
let currentCategory = null;

const itemData = {
    props: [
        { icon: '🎩', label: 'Hat' },
        { icon: '🧸', label: 'Toy' }
    ],
    buildings: [
        { icon: '🏠', label: 'House' },
        { icon: '🏢', label: 'Office' }
    ],
    nature: [
        { icon: '🌳', label: 'Oak' },
        { icon: '🌸', label: 'Flower' }
    ],
    animals: [
        { icon: '🐄', label: 'Cow' },
        { icon: '🐑', label: 'Sheep' }
    ]
};

export function init() {
    overlayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            if (currentCategory === category && itemPanel.classList.contains('visible')) {
                itemPanel.classList.remove('visible');
                overlayBtns.forEach(b => b.classList.remove('active'));
                currentCategory = null;
                return;
            }

            overlayBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentCategory = category;
            panelHeader.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            renderItems(category);
            itemPanel.classList.add('visible');
        });
    });


    document.addEventListener('mousedown', e => {
        if (!itemPanel.contains(e.target) && ![...overlayBtns].includes(e.target)) {
            itemPanel.classList.remove('visible');
            overlayBtns.forEach(b => b.classList.remove('active'));
            currentCategory = null;
        }
    });
}

function renderItems(category) {
    itemList.innerHTML = '';
    (itemData[category] || []).forEach(item => {
        const div = document.createElement('div');
        div.className = 'draggable-item';
        div.innerHTML = `<span class="item-icon">${item.icon}</span><span>${item.label}</span>`;
        itemList.appendChild(div);
    });
}

