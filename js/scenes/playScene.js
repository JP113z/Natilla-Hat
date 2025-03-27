import { hatsManager } from "../hatsManager.js";
import { GameManager } from "../gameManager.js";
import { Card } from "../gameObjects/card.js";

export class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
        console.log(this);
        this.player = null;
        this.platform = null;
        this.score = 0;
        this.health = 10;
        this.hats = [];
        this.objects = {
            points: [],
            damage: [],
            health: []
        };
        this.spawnRates = {
            points: 0.6,
            damage: 0.3,
            health: 0.1
        };
        this.fallSpeed = 100;
    }

    preload() {
        this.load.image('cat', 'assets/images/cat.png');
        this.load.image('platform', 'assets/images/platform.png');
        this.load.image('pointObj', 'assets/images/point.png');
        this.load.image('damageObj', 'assets/images/damage.png');
        this.load.image('healthObj', 'assets/images/health.png');

        // Sonidos
        this.load.audio('pointSound', './assets/sound/point.mp3');
        this.load.audio('damageSound', './assets/sound/damage.mp3');
        this.load.audio('healthSound', './assets/sound/health.mp3');
    }

    create() {
        // Configuración inicial
        const width = GameManager.instance.width;
        const height = GameManager.instance.height;

        // Fondo
        this.add.image(width / 2, height / 2, 'menuBg').setDisplaySize(width, height);

        // Efectos de sonido
        this.pointSound = this.sound.add('pointSound');
        this.damageSound = this.sound.add('damageSound');
        this.healthSound = this.sound.add('healthSound');

        // Crear jugador
        this.player = this.physics.add.sprite(width / 2, height - 100, 'cat');
        this.player.setCollideWorldBounds(true);

        // Crear plataforma
        this.platform = this.physics.add.sprite(width / 2, height - 50, 'platform');
        this.platform.setImmovable(true);

        // Crear HUD
        this.createHUD();

        // Crear objetos
        this.spawnObject();

        // Colisiones
        this.physics.add.collider(this.player, this.platform);
        this.physics.add.collider(this.objects.points, this.platform);
        this.physics.add.collider(this.objects.damage, this.platform);
        this.physics.add.collider(this.objects.health, this.platform);
    }

    update() {
        this.checkObjectCollisions();

    }

    createHUD() {
        // Texto de puntuación
        this.scoreText = this.add.text(
            20, 20,
            `Puntos: ${this.score}`,
            { fontSize: '24px', fill: '#000' }
        );

        // Texto de salud
        this.healthText = this.add.text(
            20, 50,
            `Salud: ${this.health}`,
            { fontSize: '24px', fill: '#000' }
        );

        // Texto de sombreros
        this.hatsText = this.add.text(
            20, 80,
            `Sombreros: ${this.hats.length}`,
            { fontSize: '24px', fill: '#000' }
        );
    }

    spawnObject() {
    }

    checkObjectCollisions() {
    }

    calculatePoints() {
    }

    getRandomHat() {
    }

    applyHatEffects(hatType) {
    }

    countHats(type) {
    }

    showHatMessage(hatType) {
    }

    increaseDifficulty() {
    }

    gameOver() {
    }
}
