//

const itemData = {
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

const overlayBtns = document.querySelectorAll('.overlay-btn');
const itemPanel = document.getElementById('item-panel');
const sceneContainer = document.getElementById('scene-container');

// 버튼 클릭 시 아이템 패널 표시
overlayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 버튼 활성화 표시
        overlayBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 아이템 패널 내용 갱신
        const category = btn.dataset.category;
        renderItemPanel(category);
    });
});

// 아이템 패널 렌더링
function renderItemPanel(category) {
    itemPanel.innerHTML = '';
    itemData[category].forEach(item => {
        const div = document.createElement('div');
        div.className = 'draggable-item';
        div.draggable = true;
        div.dataset.type = item.type;
        div.innerHTML = `<span class="item-icon">${item.icon}</span><span>${item.label}</span>`;

        // 드래그 이벤트
        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', item.type);
        });

        itemPanel.appendChild(div);
    });
    itemPanel.classList.add('visible');
}

// Scene에 드롭 이벤트
sceneContainer.addEventListener('dragover', e => {
    e.preventDefault();
});
sceneContainer.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (type) {
        // Three.js 씬에 아이템 추가하는 함수 호출
        addItemToScene(type, e.clientX, e.clientY);
    }
    // 아이템 패널 닫기 (원한다면)
    itemPanel.classList.remove('visible');
    overlayBtns.forEach(b => b.classList.remove('active'));
});

// 예시: Three.js 씬에 아이템 추가 (실제 구현은 원하는 대로!)
function addItemToScene(type, x, y) {
    console.log('Add to scene:', type, 'at', x, y);
    // 예: Three.js에서 type에 따라 3D 모델 생성 및 위치 지정
}

// 바깥 클릭 시 패널 닫기 (선택사항)
document.addEventListener('click', e => {
    if (!itemPanel.contains(e.target) && ![...overlayBtns].includes(e.target)) {
        itemPanel.classList.remove('visible');
        overlayBtns.forEach(b => b.classList.remove('active'));
    }
});
