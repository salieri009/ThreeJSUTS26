// ui-controller.js

//This is for the test//
const categories = [
    {
        name: 'Animals',
        icon: '🐻',
        animals: ['호랑이', '여우', '토끼', '늑대', '곰', '사슴']
    },
    {
        name: '해양동물',
        icon: '🐟',
        animals: ['상어', '고래', '문어', '거북이', '해마', '돌고래']
    },
    {
        name: '조류',
        icon: '🦉',
        animals: ['부엉이', '참새', '독수리', '까치', '오리', '황새']
    }
];

export function setupUIController({ onAnimalSelect }) {
    const nav = document.querySelector('.animal-category-nav');
    const animalSection = document.querySelector('.animal-selection');
    let selectedCategoryIdx = 0;

    function renderCategories(selectedIdx = 0) {
        nav.innerHTML = '';
        categories.forEach((cat, idx) => {
            const btn = document.createElement('button');
            btn.className = 'circle-btn';
            btn.innerText = cat.icon;
            btn.setAttribute('aria-label', cat.name);
            if (idx === selectedIdx) btn.classList.add('selected');
            btn.addEventListener('click', () => {
                selectedCategoryIdx = idx;
                renderCategories(idx);
                renderAnimals(categories[idx].animals);
            });
            nav.appendChild(btn);
        });
    }

    function renderAnimals(animalList) {
        animalSection.innerHTML = '';
        animalList.forEach(animal => {
            const btn = document.createElement('button');
            btn.className = 'animal-btn';
            btn.innerText = animal;
            btn.addEventListener('click', () => {
                animalSection.querySelectorAll('.animal-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                if (onAnimalSelect) onAnimalSelect(animal);
            });
            animalSection.appendChild(btn);
        });
    }

    // 최초 렌더링
    renderCategories(selectedCategoryIdx);
    renderAnimals(categories[selectedCategoryIdx].animals);
}
