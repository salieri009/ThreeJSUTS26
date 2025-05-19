// gameManager.js

const GameManager = {
    // 게임 상태
    state: {
        resources: {
            wheat: 0,
            wood: 0,
            gem: 0
        },
        animals: {
            cow: 0,
            sheep: 0
        },
        upgrades: {
            speed: 0,
            bonus: 0,
            autoHarvest: false
        },
        lastTick: Date.now()
    },

    // 자원 생산 속도/보너스 등 계산
    getProductionRate() {
        let base = 1 + this.state.upgrades.speed * 0.1;
        let bonus = 1 + this.state.upgrades.bonus * 0.2;
        return base * bonus;
    },

    // 주기적으로 자원 생산 (1초마다)
    tick() {
        const now = Date.now();
        const diff = (now - this.state.lastTick) / 1000; // 초 단위
        this.state.lastTick = now;

        // 자원 생산
        const rate = this.getProductionRate();
        this.state.resources.wheat += rate * diff * (this.state.animals.cow + this.state.animals.sheep * 0.8);
        this.state.resources.wood += 0.5 * diff;
        this.state.resources.gem += 0.01 * diff;

        // 자동 수확
        if (this.state.upgrades.autoHarvest) {
            this.harvest();
        }

        this.updateUI();
    },

    // 수확(즉시 자원 획득)
    harvest() {
        // 예시: 동물 1마리당 wheat 5씩 추가
        this.state.resources.wheat += 5 * (this.state.animals.cow + this.state.animals.sheep);
        this.updateUI();
    },

    // 업그레이드 구매
    buyUpgrade(type) {
        if (type === 'speed' && this.state.resources.gem >= 50) {
            this.state.resources.gem -= 50;
            this.state.upgrades.speed += 1;
        }
        if (type === 'bonus' && this.state.resources.wood >= 100) {
            this.state.resources.wood -= 100;
            this.state.upgrades.bonus += 1;
        }
        if (type === 'autoHarvest' && this.state.resources.gem >= 150 && !this.state.upgrades.autoHarvest) {
            this.state.resources.gem -= 150;
            this.state.upgrades.autoHarvest = true;
        }
        this.updateUI();
    },

    // 동물 추가
    addAnimal(type) {
        if (type === 'cow') this.state.animals.cow += 1;
        if (type === 'sheep') this.state.animals.sheep += 1;
        this.updateUI();
    },

    // UI 갱신 (외부에서 연결)
    updateUI() {
        // 예시: resource-bar 업데이트
        document.querySelector('.resource-bar').innerHTML = `
            <span>🌾 ${Math.floor(this.state.resources.wheat)}</span>
            <span>🌳 ${Math.floor(this.state.resources.wood)}</span>
            <span>💎 ${Math.floor(this.state.resources.gem)}</span>
        `;
        // TODO: 업그레이드 버튼 활성화/비활성화 등도 처리
    },

    // 저장/불러오기
    save() {
        localStorage.setItem('animalSimSave', JSON.stringify(this.state));
    },
    load() {
        const data = localStorage.getItem('animalSimSave');
        if (data) {
            this.state = JSON.parse(data);
            this.updateUI();
        }
    },

    // 초기화
    init() {
        this.load();
        setInterval(() => this.tick(), 1000);
        window.addEventListener('beforeunload', () => this.save());
        this.updateUI();
    }
};

export default GameManager;
