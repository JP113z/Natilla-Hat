import { GameManager } from "../gameManager.js";

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.image('playBtn', './assets/images/playBtn.png');
        this.load.image('menuBg', './assets/images/menu_bg.png');
        this.load.audio('menuMusic', './assets/sound/menu_music.mp3');
        this.load.audio('clickSound', './assets/sound/click.mp3');
    }

    create() {
        // Configuración inicial
        const width = GameManager.instance.width;
        const height = GameManager.instance.height;

        // Fondo con gradiente o imagen
        this.add.image(width / 2, height / 2, 'menuBg').setDisplaySize(width, height);

        // Efectos de sonido
        this.clickSound = this.sound.add('clickSound');
        this.menuMusic = this.sound.add('menuMusic', { loop: true, volume: 0.3 });
        this.menuMusic.play();

        // Título del juego con estilo moderno
        const title = this.add.text(width / 2, height / 3, 'NATILLA HAT', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#FFD700',
            stroke: '#000',
            strokeThickness: 8,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000',
                blur: 5,
                stroke: true
            }
        }).setOrigin(0.5);

        // Subtítulo con animación
        const subtitle = this.add.text(width / 2, height / 3 + 90, 'Un juego memorable', {
            fontSize: '32px',
            fontStyle: 'italic',
            color: '#FFF',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Animación de pulso para el subtítulo
        this.tweens.add({
            targets: subtitle,
            scale: { from: 0.95, to: 1.05 },
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Botón de jugar con efectos
        this.playBtn = this.add.sprite(width / 2, height / 2 + 120, 'playBtn')
            .setScale(2)
            .setInteractive({ useHandCursor: true });

        // Texto del botón (por si la imagen no lo incluye)
        const playText = this.add.text(width / 2, height / 2 + 120, 'JUGAR', {
            fontSize: '36px',
            color: '#FFFFFF',
            stroke: '#000',
            strokeThickness: 4,
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        // Efectos hover para el botón
        this.playBtn.on('pointerover', () => {
            this.playBtn.setScale(1.70);
            playText.setScale(0.85);
        });

        this.playBtn.on('pointerout', () => {
            this.playBtn.setScale(2);
            playText.setScale(1.0);
        });

        this.playBtn.on('pointerdown', () => {
            this.clickSound.play();
            this.playBtn.setScale(0.75);
            playText.setScale(0.95);

            // Transición con efecto
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.menuMusic.stop();
                this.scene.start('PlayScene');
            });
        });

        // Créditos o versión en la parte inferior
        this.add.text(width / 2, height - 40, 'Versión 1.0 · © 2025', {
            fontSize: '16px',
            color: '#AAAAAA',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    shutdown() {
        // Detener música al salir de la escena
        this.menuMusic.stop();
    }
}