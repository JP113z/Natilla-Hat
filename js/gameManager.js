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

        this.width = window.outerWidth;
        this.height = window.outerHeight
        this.hatsManager = new hatsManager();
        this.game = new Game(this.width, this.height);
    }
}