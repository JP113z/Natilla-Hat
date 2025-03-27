import { GameManager } from "../gameManager.js";

export class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    preload() {
        this.load.image('playAgainBtn', './assets/images/playAgainBtn.png');
        this.load.image('menuBtn', './assets/images/menuBtn.png');
        this.load.audio('gameOver', './assets/sound/gameover.mp3');
    }

    create() {
        this.gameOverSound = this.sound.add('gameOver', { loop: true, volume: 0.5 });
        this.gameOverSound.play();

        const width = GameManager.instance.width;
        const height = GameManager.instance.height;
        let ypos = height / 2 - 150;

    }

    update() {

    }

    shutdown() {
        this.gameOverSound.stop();
    }
}