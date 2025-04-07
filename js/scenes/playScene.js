import { hatsManager } from "../hatsManager.js";
import { GameManager } from "../gameManager.js";

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
            health: 0.2
        };
        this.fallSpeed = 100;
        this.objectsToRemove = [];
        this.objectScale = 0.1; // Tamaño de los objetos que acen
    }

    preload() {
        this.load.image('cat', 'assets/images/cat.png');
        this.load.image('platform', 'assets/images/platform.png');
        this.load.image('pointObj', 'assets/images/point.png');
        this.load.image('damageObj', 'assets/images/damage.png');
        this.load.image('healthObj', 'assets/images/health.png');
        this.load.image('leftHalf', 'assets/images/leftHalfScreen.png');
        this.load.image('rightHalf', 'assets/images/rightHalfScreen.png');
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
        this.add.image(200, 300, 'leftHalf');
        this.add.image(600, 300, 'rightHalf');

        // Manejo de clicks
        let leftPush = false;
        let rightPush = false;
        const leftZone = this.add.zone(200, 300, 400, 600);
        leftZone.setInteractive();
        const rightZone = this.add.zone(600, 300, 400, 600);
        rightZone.setInteractive();

        leftZone.on('pointerdown', (pointer) => {
            leftPush = true;
        });
        rightZone.on('pointerdown', (pointer) => {
            rightPush = true;
        });

        this.input.on('pointerup', (pointer) => {
            leftPush = false;
            rightPush = false;
        });

        // Efectos de sonido
        this.pointSound = this.sound.add('pointSound');
        this.damageSound = this.sound.add('damageSound');
        this.healthSound = this.sound.add('healthSound');

        // Crear jugador
        this.player = this.physics.add.sprite(width / 2 + 50, height - 200, 'cat').setDepth(5);
        this.player.setImmovable(false);
        this.player.setGravityY(2000);
        this.player.setFriction(0);
        this.player.setCollideWorldBounds(true);
        this.player.body.setBounce(1);


        // Obtener tamaño del gato para redimensionar los otros objetos proporcionalmente
        this.catWidth = this.player.width;
        this.catHeight = this.player.height;

        // Crear plataforma
        this.platform = this.physics.add.image(400, 550, 'platform');  // Posición y textura de la plataforma
        // Propiedades físicas de plataforma
        this.platform.setImmovable(false);
        this.platform.setCollideWorldBounds(true);
        this.platform.setGravityY(0);
        this.platform.setFriction(5);
        this.platform.body.allowRotation = true; // Allow rotation
        this.platform.body.setBounce(0); // Prevent bouncing
        this.platform.body.setAngularDrag(100); // Dampen rotation over time
        this.platform.body.setMass(10); // Make the platform heavier for stability
        this.platform.setImmovable(true);

        // Interaccion fisicas plataforma - jugador
        this.physics.add.collider(this.player, this.platform, () => {

        });
        // Cambia la posicion del gato relativo a la posicion de la plataforma
        this.events.on('update', () => {
            this.platform.body.updateFromGameObject(); // Sync collider with platform's rotation and position
        });

        // Mover plataforma
        this.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (leftPush) {
                    this.seesawRotation(this.platform, 80);
                }
                else if (rightPush) {
                    this.seesawRotation(this.platform, -80);
                }
                else {
                    this.seesawRotation(this.platform, 0);
                }
            }
        });

        this.createHUD();

        // Configurar temporizador para spawn de objetos
        this.time.addEvent({
            delay: 300,
            callback: this.spawnObject,
            callbackScope: this,
            loop: true
        });

        // Colisiones
        this.physics.add.collider(this.player, this.platform);
    }

    update() {
        // Limpiar objetos que están fuera de la pantalla
        this.cleanupObjects();

        // Actualizar HUD
        this.updateHUD();
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

    updateHUD() {
        this.scoreText.setText(`Puntos: ${this.score}`);
        this.healthText.setText(`Salud: ${this.health}`);
        this.hatsText.setText(`Sombreros: ${this.hats.length}`);
    }

    spawnObject() {
        const width = GameManager.instance.width;
        const randomX = Phaser.Math.Between(100, width - 100);
        const randomType = this.getRandomObjectType();
        let object;

        switch (randomType) {
            case 'points':
                object = this.physics.add.sprite(randomX, 0, 'pointObj');
                object.objectType = 'points';
                this.objects.points.push(object);
                break;
            case 'damage':
                object = this.physics.add.sprite(randomX, 0, 'damageObj');
                object.objectType = 'damage';
                this.objects.damage.push(object);
                break;
            case 'health':
                object = this.physics.add.sprite(randomX, 0, 'healthObj');
                object.objectType = 'health';
                this.objects.health.push(object);
                break;
        }

        // Ajustar el tamaño del objeto para que sea proporcional al gato
        this.resizeObject(object);

        // Configurar física del objeto
        object.body.velocity.y = this.fallSpeed;

        // Colisiones con el jugador
        this.physics.add.overlap(this.player, object, this.handleObjectCollision, null, this);

    }

    resizeObject(object) {
        object.setScale(this.objectScale);
        object.body.setSize(object.width * object.scaleX, object.height * object.scaleY);
    }
    bounce(player) {
        player.y = player.y - 10;
    }
    getRandomObjectType() {
        const rand = Math.random();
        if (rand < this.spawnRates.points) {
            return 'points';
        } else if (rand < this.spawnRates.points + this.spawnRates.damage) {
            return 'damage';
        } else {
            return 'health';
        }
    }

    seesawRotation(seesaw, velocity) {
        seesaw.setAngularVelocity(velocity);
    }
    handleObjectCollision(player, object) {
        switch (object.objectType) {
            case 'points':
                this.collectPoints(object);
                break;
            case 'damage':
                this.takeDamage(object);
                break;
            case 'health':
                this.gainHealth(object);
                break;
        }
    }

    collectPoints(object) {
        // Sumar un punto al score
        this.score += 1;
        this.pointSound.play();

        // Verificar si se obtuvo un sombrero
        if (this.score % 50 === 0) {
            this.hats.push(1); // Se agrega cualquier sombrero temporalmente
        }

        // Remover el objeto
        this.removeObject(object);
    }

    takeDamage(object) {
        // Reducir vida
        this.health--;
        this.damageSound.play();

        // Remover el objeto
        this.removeObject(object);
    }

    gainHealth(object) {
        // Recuperar 1 punto de vida, máximo 10
        this.health = Math.min(this.health + 1, 10);
        this.healthSound.play();

        // Remover el objeto
        this.removeObject(object);
    }

    removeObject(object) {
        // Marcar para eliminar en el próximo ciclo
        this.objectsToRemove.push(object);
    }

    cleanupObjects() {
        const height = GameManager.instance.height;

        // Eliminar objetos marcados
        for (const obj of this.objectsToRemove) {
            // Eliminar de los arrays correspondientes
            if (obj.objectType === 'points') {
                this.objects.points = this.objects.points.filter(o => o !== obj);
            } else if (obj.objectType === 'damage') {
                this.objects.damage = this.objects.damage.filter(o => o !== obj);
            } else if (obj.objectType === 'health') {
                this.objects.health = this.objects.health.filter(o => o !== obj);
            }

            // Destruir el objeto
            obj.destroy();
        }
        this.objectsToRemove = [];

        // Verificar objetos fuera de pantalla
        const allObjects = [...this.objects.points, ...this.objects.damage, ...this.objects.health];
        for (const obj of allObjects) {
            if (obj.y > height + 50) {
                this.removeObject(obj);
            }
        }
    }

    calculatePoints() {
        return this.score;
    }

    getRandomHat() {
        return 'basic';
    }

    applyHatEffects(hatType) {
    }

    countHats(type) {
        return this.hats.filter(h => h === type).length;
    }

    showHatMessage(hatType) {
    }

    increaseDifficulty() {
        // Aumentar velocidad de caída
        this.fallSpeed += 10;

        // Aumwenta el spawn
        this.spawnRates.damage = Math.min(this.spawnRates.damage + 0.05, 0.5);
        this.spawnRates.points = Math.max(this.spawnRates.points - 0.03, 0.4);
    }

    gameOver() {
        // Por implementar bien
        this.scene.start('GameOverScene', { score: this.score, hats: this.hats.length });
    }
}