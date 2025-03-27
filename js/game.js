import { PlayScene } from "./scenes/playScene.js";
import { MenuScene } from "./scenes/menuScene.js";
import { EndScene } from "./scenes/endScene.js";

export class Game extends Phaser.Game {
    constructor(width, height) {
        let config = {
            type: Phaser.AUTO,
            width: width,
            height: height,
            backgroundColor: '#E6E7E8',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
        };

        super(config);

        // Opcional: Si prefieres registrar escenas manualmente
        this.scene.add('MenuScene', MenuScene);
        this.scene.add('PlayScene', PlayScene);
        this.scene.add('EndScene', EndScene);

        this.scene.start('MenuScene');
    }
}