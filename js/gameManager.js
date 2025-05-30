import { hatsManager } from "./hatsManager.js";
import { Game } from "./game.js";
import { Stats } from './libs/stats.js';

export class GameManager {
    constructor() {
        if (GameManager.instance) {
            return GameManager.instance;
        } else {
            GameManager.instance = this;
        }

        this.width = 1366;
        this.height = 1024;
        this.hatsManager = new hatsManager();
        this.game = new Game(this.width, this.height);
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
    }
}