export default class GameManager {
    constructor() {
        this.state = {
            resources: { wood: 0, stone: 0, gold: 0 },
            clickPower: 1,
            autoWood: 0
        };
    }

    gatherResource(type) {
        this.state.resources[type] += this.state.clickPower;
    }

    autoGenerateResources() {
        this.state.resources.wood += this.state.autoWood;
    }
}
