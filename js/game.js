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
                default: 'matter',
                matter: {
                    debug: false
                }
            },
        };

        super(config);

        this.scene.add('MenuScene', MenuScene);
        this.scene.add('PlayScene', PlayScene);
        this.scene.add('EndScene', EndScene);

        this.scene.start('MenuScene');

    }
}