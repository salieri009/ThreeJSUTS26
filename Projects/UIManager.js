// UIManager.js
export default class UIManager {
    constructor() {
        this.createUI();
    }

    createUI() {
        const div = document.createElement("div");
        div.innerHTML = "<h1 style='position: absolute; top: 10px; left: 10px; color: white;'>UI Manager</h1>";
        document.body.appendChild(div);
    }

    updateScore(score) {
        // 점수 갱신하는 로직
    }

    showMessage(msg) {
        // 메시지를 화면에 띄우는 로직
    }
}
