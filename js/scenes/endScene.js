import { GameManager } from "../gameManager.js";

export class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    init(data) {
        this.score = data.score || 0;
        this.hats = data.hats || 0;
    }

    preload() {
        this.load.image('endBg', './assets/images/menu_bg.png');
        this.load.image('playAgainBtn', './assets/images/playBtn.png');
        this.load.image('menuBtn', './assets/images/menuBtn.png');

        // Cargar imágenes de sombreros para el resumen
        this.load.image('hat1', 'assets/images/hat1.png');
        this.load.image('hat2', 'assets/images/hat2.png');
        this.load.image('hat3', 'assets/images/hat3.png');
        this.load.image('hat4', 'assets/images/hat4.png');
        this.load.image('hat5', 'assets/images/hat5.png');

        // Sonidos
        this.load.audio('endMusic', './assets/sound/end_music.mp3');
        this.load.audio('clickSound', './assets/sound/click.mp3');
    }

    create() {
        // Configuración inicial
        const width = GameManager.instance.width;
        const height = GameManager.instance.height;

        // Fondo
        this.add.image(width / 2, height / 2, 'endBg').setDisplaySize(width, height);

        // Efectos de sonido
        this.clickSound = this.sound.add('clickSound');
        this.endMusic = this.sound.add('endMusic', { loop: true, volume: 0.3 });
        this.endMusic.play();

        // Título
        this.add.text(width / 2, 80, '¡FIN DEL JUEGO!', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#FFD700',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Puntuación
        this.add.text(width / 2, 150, `Puntuación: ${this.score}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Sombreros obtenidos
        this.add.text(width / 2, 200, `Sombreros: ${this.hats}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Resumen de sombreros
        this.showHatsCollection();

        // Botón jugar de nuevo
        const playAgainBtn = this.add.sprite(width / 2, height - 120, 'playAgainBtn')
            .setScale(1.5)
            .setInteractive({ useHandCursor: true });

        // Texto del botón
        const playAgainText = this.add.text(width / 2, height - 120, '', {
            fontSize: '24px',
            color: '#FFFFFF',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Botón menú principal
        const menuBtn = this.add.sprite(width / 2, height - 60, 'menuBtn')
            .setScale(1.5)
            .setInteractive({ useHandCursor: true });

        // Texto del botón
        const menuText = this.add.text(width / 2, height - 60, '', {
            fontSize: '24px',
            color: '#FFFFFF',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Efectos para los botones
        playAgainBtn.on('pointerover', () => {
            playAgainBtn.setScale(1.6);
            playAgainText.setScale(1.1);
        });

        playAgainBtn.on('pointerout', () => {
            playAgainBtn.setScale(1.5);
            playAgainText.setScale(1.0);
        });

        menuBtn.on('pointerover', () => {
            menuBtn.setScale(1.6);
            menuText.setScale(1.1);
        });

        menuBtn.on('pointerout', () => {
            menuBtn.setScale(1.5);
            menuText.setScale(1.0);
        });

        // Eventos de los botones
        playAgainBtn.on('pointerdown', () => {
            this.clickSound.play();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.endMusic.stop();
                this.scene.start('PlayScene');
            });
        });

        menuBtn.on('pointerdown', () => {
            this.clickSound.play();
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.time.delayedCall(500, () => {
                this.endMusic.stop();
                this.scene.start('MenuScene');
            });
        });
    }

    showHatsCollection() {
        const width = GameManager.instance.width;
        const hatsManager = GameManager.instance.hatsManager;

        if (hatsManager.totalHats === 0) {
            // No se obtuvieron sombreros
            this.add.text(width / 2, 280, 'No obtuviste ningún sombrero', {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#AAAAAA',
                fontStyle: 'italic'
            }).setOrigin(0.5);
            return;
        }

        // Título del resumen
        this.add.text(width / 2, 240, 'SOMBREROS OBTENIDOS:', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Crear contenedor para los sombreros
        const container = this.add.container(width / 2, 350);

        let xPos = -200;
        const yPos = 0;
        const spacing = 100;

        // Mostrar cada tipo de sombrero obtenido
        for (let i = 1; i <= 5; i++) {
            const count = hatsManager.countHatsOfType(i);
            if (count > 0) {
                // Imagen del sombrero
                const hatImg = this.add.image(xPos, yPos, `hat${i}`).setScale(0.8);

                // Cantidad
                const countText = this.add.text(xPos, yPos + 40, `x${count}`, {
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#FFFFFF',
                    fontWeight: 'bold'
                }).setOrigin(0.5);

                container.add([hatImg, countText]);
                xPos += spacing;
            }
        }

        // Centrar el contenedor si hay pocos sombreros
        if (container.list.length / 2 < 5) {
            container.x = width / 2 - ((container.list.length / 2) * spacing / 2) + spacing / 2;
        }
    }

    shutdown() {
        this.endMusic.stop();
    }
}