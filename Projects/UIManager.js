// UIManager.js
export default class UIManager {
    constructor() {
        this.wood = 1000;
        this.stone = 500;
        this.gold = 2000;

        this.woodElement = document.getElementById("resource-wood");
        this.stoneElement = document.getElementById("resource-stone");
        this.goldElement = document.getElementById("resource-gold");

        this._startAutoResourceGain();
    }

    updateResourcesDisplay() {
        this.woodElement.textContent = Math.floor(this.wood);
        this.stoneElement.textContent = Math.floor(this.stone);
        this.goldElement.textContent = Math.floor(this.gold);
    }

    _startAutoResourceGain() {
        setInterval(() => {
            this.wood += 5;  // 방치형 요소: 초당 증가
            this.stone += 2;
            this.gold += 10;
            this.updateResourcesDisplay();
        }, 1000); // 1초마다 자원 증가
    }

    addResources({ wood = 0, stone = 0, gold = 0 }) {
        this.wood += wood;
        this.stone += stone;
        this.gold += gold;
        this.updateResourcesDisplay();
    }

    spendResources({ wood = 0, stone = 0, gold = 0 }) {
        if (this.wood >= wood && this.stone >= stone && this.gold >= gold) {
            this.wood -= wood;
            this.stone -= stone;
            this.gold -= gold;
            this.updateResourcesDisplay();
            return true;
        }
        return false;
    }
}
