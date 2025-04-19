// UIManager.js
// 방치형(Idle) 게임용 UI 매니저 예시

export default class UIManager {
    constructor() {
        // 게임 상태
        this.resources = {
            wood: 0,
            stone: 0,
            gold: 0
        };
        this.perSecond = {
            wood: 0,
            stone: 0,
            gold: 0
        };
        this.upgrades = {
            clickPower: 1,
            autoWood: 0
        };

        this.createUI();
        this.bindEvents();
        this.startResourceLoop();
    }

    createUI() {
        // 전체 UI 컨테이너
        this.uiRoot = document.createElement("div");
        this.uiRoot.style.position = "fixed";
        this.uiRoot.style.top = "20px";
        this.uiRoot.style.left = "20px";
        this.uiRoot.style.zIndex = "100";
        this.uiRoot.style.color = "#fff";
        this.uiRoot.style.fontFamily = "sans-serif";
        this.uiRoot.innerHTML = `
            <div id="resource-panel" style="background:rgba(0,0,0,0.7);padding:16px 24px;border-radius:10px;min-width:220px;">
                <div style="font-size:1.3em;font-weight:bold;margin-bottom:10px;">자원</div>
                <div>🪵 <span id="wood-count">0</span> <small>(+<span id="wood-ps">0</span>/s)</small></div>
                <div>🪨 <span id="stone-count">0</span> <small>(+<span id="stone-ps">0</span>/s)</small></div>
                <div>💰 <span id="gold-count">0</span> <small>(+<span id="gold-ps">0</span>/s)</small></div>
                <button id="gather-wood" style="margin-top:10px;">🪓 나무 캐기 (+<span id="click-power">1</span>)</button>
            </div>
            <div id="shop-panel" style="background:rgba(20,20,20,0.7);padding:16px 24px;border-radius:10px;min-width:220px;margin-top:18px;">
                <div style="font-size:1.1em;font-weight:bold;margin-bottom:8px;">상점</div>
                <button id="upgrade-click" style="margin-bottom:8px;width:100%;">클릭 강화<br>💰 50</button>
                <button id="buy-auto-wood" style="width:100%;">나무 자동화<br>💰 200</button>
            </div>
            <div id="message-panel" style="margin-top:18px;min-height:20px;"></div>
        `;
        document.body.appendChild(this.uiRoot);

        // 요소 참조 저장
        this.woodCount = this.uiRoot.querySelector("#wood-count");
        this.stoneCount = this.uiRoot.querySelector("#stone-count");
        this.goldCount = this.uiRoot.querySelector("#gold-count");
        this.woodPS = this.uiRoot.querySelector("#wood-ps");
        this.stonePS = this.uiRoot.querySelector("#stone-ps");
        this.goldPS = this.uiRoot.querySelector("#gold-ps");
        this.clickPowerEl = this.uiRoot.querySelector("#click-power");
        this.messagePanel = this.uiRoot.querySelector("#message-panel");
        this.upgradeClickBtn = this.uiRoot.querySelector("#upgrade-click");
        this.buyAutoWoodBtn = this.uiRoot.querySelector("#buy-auto-wood");
        this.gatherWoodBtn = this.uiRoot.querySelector("#gather-wood");
    }

    bindEvents() {
        // 나무 클릭 수집
        this.gatherWoodBtn.addEventListener("click", () => {
            this.resources.wood += this.upgrades.clickPower;
            this.showFloatingText(`+${this.upgrades.clickPower}🪵`, this.gatherWoodBtn, "#4CAF50");
            this.updateUI();
        });

        // 클릭 강화 업그레이드
        this.upgradeClickBtn.addEventListener("click", () => {
            if (this.resources.gold >= 50) {
                this.resources.gold -= 50;
                this.upgrades.clickPower += 1;
                this.clickPowerEl.textContent = this.upgrades.clickPower;
                this.showMessage("클릭 강화! (파워 +1)");
                this.updateUI();
            } else {
                this.showMessage("골드가 부족합니다!");
            }
        });

        // 나무 자동화 업그레이드
        this.buyAutoWoodBtn.addEventListener("click", () => {
            if (this.resources.gold >= 200) {
                this.resources.gold -= 200;
                this.upgrades.autoWood += 1;
                this.perSecond.wood += 2;
                this.showMessage("나무 자동화 레벨 업! (+2/s)");
                this.updateUI();
            } else {
                this.showMessage("골드가 부족합니다!");
            }
        });
    }

    startResourceLoop() {
        // 1초마다 자동 자원 획득
        setInterval(() => {
            this.resources.wood += this.perSecond.wood;
            this.resources.stone += this.perSecond.stone;
            this.resources.gold += this.perSecond.gold;
            this.updateUI();
        }, 1000);
    }

    updateUI() {
        this.woodCount.textContent = Math.floor(this.resources.wood);
        this.stoneCount.textContent = Math.floor(this.resources.stone);
        this.goldCount.textContent = Math.floor(this.resources.gold);
        this.woodPS.textContent = this.perSecond.wood;
        this.stonePS.textContent = this.perSecond.stone;
        this.goldPS.textContent = this.perSecond.gold;
        this.clickPowerEl.textContent = this.upgrades.clickPower;
    }

    showMessage(msg) {
        this.messagePanel.textContent = msg;
        setTimeout(() => {
            if (this.messagePanel.textContent === msg) this.messagePanel.textContent = "";
        }, 2000);
    }

    showFloatingText(text, targetEl, color="#fff") {
        // 타겟 요소의 위치 계산
        const rect = targetEl.getBoundingClientRect();
        const floatDiv = document.createElement("div");
        floatDiv.textContent = text;
        floatDiv.style.position = "fixed";
        floatDiv.style.left = `${rect.left + rect.width/2 - 20}px`;
        floatDiv.style.top = `${rect.top - 10}px`;
        floatDiv.style.color = color;
        floatDiv.style.fontWeight = "bold";
        floatDiv.style.pointerEvents = "none";
        floatDiv.style.transition = "all 1s cubic-bezier(0.4,1.4,0.4,1)";
        floatDiv.style.opacity = "1";
        document.body.appendChild(floatDiv);
        setTimeout(() => {
            floatDiv.style.top = `${rect.top - 40}px`;
            floatDiv.style.opacity = "0";
        }, 10);
        setTimeout(() => floatDiv.remove(), 1100);
    }
}
