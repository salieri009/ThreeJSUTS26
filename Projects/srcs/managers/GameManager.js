export default class GameManager {
    constructor() {
        this.resources = {
            wood: 0,
            stone: 0,
            gold: 0
        };

        // Upgrade levels and corresponding costs
        this.expansionLevels = [
            { size: 14, cost: { wood: 1000, stone: 500, gold: 2000 } },
            { size: 23, cost: { wood: 3000, stone: 1500, gold: 5000 } },
            { size: 32, cost: { wood: 8000, stone: 4000, gold: 12000 } },
            { size: 50, cost: { wood: 20000, stone: 10000, gold: 30000 } }
        ];

        this.currentLevel = 0; // Start at level 0 (expand to 14 first)
    }

    checkExpansion() {
        if (this.currentLevel >= this.expansionLevels.length) {
            console.log("Maximum expansion reached!");
            return;
        }

        const currentExpansion = this.expansionLevels[this.currentLevel];
        const { wood, stone, gold } = currentExpansion.cost;

        // Check if resources meet the requirements
        if (this.resources.wood >= wood &&
            this.resources.stone >= stone &&
            this.resources.gold >= gold) {
            cubeManager.expandGrid(currentExpansion.size); // Expand grid to the next level
            this.deductResources(wood, stone, gold);      // Deduct resources
            this.currentLevel++;                          // Move to the next level
            console.log(`Grid expanded to size ${currentExpansion.size}`);
        } else {
            console.log("Not enough resources to expand!");
        }
    }

    deductResources(wood, stone, gold) {
        this.resources.wood -= wood;
        this.resources.stone -= stone;
        this.resources.gold -= gold;
    }

    // For debugging or status updates
    getNextExpansionCost() {
        if (this.currentLevel < this.expansionLevels.length) {
            return this.expansionLevels[this.currentLevel].cost;
        } else {
            return null; // No more expansions available
        }
    }
}