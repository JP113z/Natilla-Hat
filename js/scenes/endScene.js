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
        this.load.image('playAgainBtn', './assets/images/playAgainBtn.png');
        this.load.image('menuBtn', './assets/images/menuBtn.png');

        // Cargar imágenes de sombreros para el resumen
        this.load.image('hat1', 'assets/newAssets/protectiveHat.png');
        this.load.image('hat2', 'assets/newAssets/explosiveHat.png');
        this.load.image('hat3', 'assets/newAssets/healHat.png');
        this.load.image('hat4', 'assets/newAssets/luffyHat.png');
        this.load.image('hat5', 'assets/newAssets/ultraRareHat.png');

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

        // Botón jugar de nuevo (solo sprite, sin texto)
        const playAgainBtn = this.add.sprite(width / 2, height - 120, 'playAgainBtn')
            .setScale(1.5)
            .setInteractive({ useHandCursor: true });

        // Botón menú principal (solo sprite, sin texto)
        const menuBtn = this.add.sprite(width / 2, height - 60, 'menuBtn')
            .setScale(1.5)
            .setInteractive({ useHandCursor: true });

        // Efectos para los botones
        playAgainBtn.on('pointerover', () => {
            playAgainBtn.setScale(1.6);
        });

        playAgainBtn.on('pointerout', () => {
            playAgainBtn.setScale(1.5);
        });

        menuBtn.on('pointerover', () => {
            menuBtn.setScale(1.6);
        });

        menuBtn.on('pointerout', () => {
            menuBtn.setScale(1.5);
        });

        // Eventos de los botones con transiciones corregidas
        playAgainBtn.on('pointerdown', () => {
            this.clickSound.play();

            // Primero detener la música
            this.endMusic.stop();

            // Crear transición más corta
            this.cameras.main.fadeOut(300, 0, 0, 0);

            // Esperar a que termine la transición antes de cambiar de escena
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Limpiar recursos antes de cambiar de escena
                this.cleanupResources();

                // Reiniciar el estado global del juego
                if (GameManager.instance) {
                    // Reiniciar el manager de sombreros
                    if (GameManager.instance.hatsManager) {
                        GameManager.instance.hatsManager.reset();
                    }

                    // Reiniciar otros estados globales si es necesario
                    // ...
                }

                // Detener esta escena explícitamente
                this.scene.stop('EndScene');

                // Iniciar nueva escena
                this.scene.start('PlayScene');
            });
        });

        menuBtn.on('pointerdown', () => {
            this.clickSound.play();

            // Primero detener la música
            this.endMusic.stop();

            // Crear transición más corta
            this.cameras.main.fadeOut(300, 0, 0, 0);

            // Esperar a que termine la transición antes de cambiar de escena
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // Limpiar recursos antes de cambiar de escena
                this.cleanupResources();

                // Detener esta escena explícitamente
                this.scene.stop('EndScene');

                // Iniciar escena del menú
                this.scene.start('MenuScene');
            });
        });
    }

    // Nuevo método para limpiar recursos de manera segura
    cleanupResources() {
        // Detener cualquier música o sonido activo de forma segura
        if (this.sound && this.sound.sounds) {
            this.sound.sounds.forEach(sound => {
                if (sound.isPlaying) {
                    sound.stop();
                }
            });
        }

        // Detener cualquier animación en curso
        if (this.tweens) {
            this.tweens.killAll();
        }

        // Asegurarnos de que no queden eventos pendientes
        if (this.time) {
            this.time.removeAllEvents();
        }

        // Asegurarse de que el contexto de física está limpio
        if (this.matter && this.matter.world) {
            this.matter.world.off('collisionstart'); // Eliminar listeners
            this.matter.world.off('beforeupdate');
        }

        // Eliminar todos los objetos de la escena si es necesario
        this.children.each(child => {
            if (child.destroy) {
                child.destroy();
            }
        });
    }

    shutdown() {
        this.cleanupResources();

        // Desregistrarse de eventos globales si existen
        if (this.input) {
            this.input.off('pointerup');
        }
    }

    showHatsCollection() {
        const width = GameManager.instance.width;
        const hatsManager = GameManager.instance.hatsManager;

        if (!hatsManager || hatsManager.totalHats === 0) {
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

    // Asegurarnos de limpiar todos los recursos al salir de la escena
    shutdown() {
        this.cleanupResources();
    }
}