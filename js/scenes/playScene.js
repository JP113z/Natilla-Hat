import { hatsManager } from "../hatsManager.js";
import { GameManager } from "../gameManager.js";
import { Card } from "../gameObjects/card.js";

export class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
        console.log(this);
        this.gameTime = 0;
        this.gameClicks = 0;
        this.timer = null;
        this.card1 = null;
        this.card2 = null;
        this.showingTimer = null;
        this.showingTime = 1000;
        this.cards = [];
    }

    preload() {

    }

    create() {

    }

    update() {

    }

}