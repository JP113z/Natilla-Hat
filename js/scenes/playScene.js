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
        this.load.image('leftBtn', 'assets/images/Left.png');
        this.load.image('rightBtn', 'assets/images/Right.png');
        this.load.image('platformCorrected', 'assets/images/platformCorrected.png');
        // Sonidos
        this.load.audio('pointSound', './assets/sound/point.mp3');
        this.load.audio('damageSound', './assets/sound/damage.mp3');
        this.load.audio('healthSound', './assets/sound/health.mp3');
    }

    create() {
        // Categorias de colision (Define un ID en hexa para cada objeto)
        this.playerCategory = 0x0001;
        this.platformCategory = 0x0002;
        this.pointCategory = 0x0003;
        this.boundsCategory = 0x0004;
        // Configuración inicial
        const width = GameManager.instance.width;
        const height = GameManager.instance.height;
        this.clicked = false;
        this.playerFlag = false; // Bandera para activar las físicas del jugador
        this.platformFlag = false; // Bandera para detener rotación de la plataforma
        // Fondo
        this.add.image(width / 2, height / 2, 'menuBg').setDisplaySize(width, height);

        // Limites en pantalla de físicas
        this.matter.world.setBounds(0, 0, width, height, 20, true, true, true, true, {
            collisionFilter: {
                category: this.boundsCategory
            }
        });

        // Zona de clickeo
        const leftZone = this.add.zone(200, 300, 400, 600);
        leftZone.setInteractive();
        const rightZone = this.add.zone(600, 300, 400, 600);
        rightZone.setInteractive();

        // Efectos de sonido
        this.pointSound = this.sound.add('pointSound');
        this.damageSound = this.sound.add('damageSound');
        this.healthSound = this.sound.add('healthSound');

        // Crear jugador (Las fisicas se declaran en el update llamando al metodo playermatter())
        this.player = this.matter.add.image(width / 2, height - 300, 'cat').setDepth(5);
        this.player.setIgnoreGravity(true);
        this.player.setCollisionCategory(this.playerCategory);
        this.player.setCollidesWith(this.platformCategory || this.pointCategory); // Define con qué categorías puede colisionar

        // Obtener tamaño del gato para redimensionar los otros objetos proporcionalmente
        this.catWidth = this.player.width;
        this.catHeight = this.player.height;

        // Crear plataforma y configurar colisiones
        this.platform = this.matter.add.sprite(400, 0, 'platformCorrected', null, {
            isStatic: false,
            density: 0.015,  // Efecto de peso
            frictionAir: 0.02
        });
        this.platform.setCollisionCategory(this.platformCategory);
        this.player.setCollidesWith(this.playerCategory);

        // Ensure the player and platform have proper collision settings
        /*this.player.setCollidesWith([this.platform.body.collisionFilter.category]);
        this.platform.setCollidesWith([this.player.body.collisionFilter.category]);*/

        // Centro de gravedad (Ancla el objeto a un punto del mundo)
        this.matter.add.worldConstraint(this.platform, 0, 0.7, {
            pointA: { x: 400, y: 500 }, // Punto de anclaje en el mundo
            pointB: { x: 0, y: 0 }, // Posición del punto relativa a la posición de la plataforma
            stiffness: 0.9, //Taylor swift
        });

        // Remove player's collision category so it gets affected by everything
        this.player.setCollisionCategory(null);

        // Mover plataforma
        let isLeftPressed = false;
        let isRightPressed = false;
        leftZone.on('pointerdown', (pointer) => {
            if (this.clicked == false) {
                this.clicked = true;
                this.playerFlag = true;
            }
            if (!isLeftPressed && this.platformFlag == false && (this.platform.angle < 20 || this.platform.angle > -20)) {

                this.platform.setAngularVelocity(-0.05); // Rotacion negativa
                console.log(this.platform.angle);
                isLeftPressed = true;
            }
        });
        rightZone.on('pointerdown', (pointer) => {
            if (this.clicked == false) {
                this.clicked = true;
                this.playerFlag = true;
            }
            if (!isLeftPressed && this.platformFlag == false && (this.platform.angle < 20 || this.platform.angle > -20)) {
                this.platform.setAngularVelocity(0.05); // Rotacion positiva
                console.log(this.platform.angle);
                isRightPressed = true;
            }
        });
        this.input.on('pointerup', (pointer) => {
            isLeftPressed = false;
            isRightPressed = false;
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

        // Crear botones de control
        const btnY = GameManager.instance.height - 50;
        const btnMargin = 20;
        const btnScale = 0.5;

    }

    update() {

        // Limpiar objetos que están fuera de la pantalla
        this.cleanupObjects();

        // Actualizar HUD
        this.updateHUD();

        // Relantizar plataforma despues de un movimiento
        this.platform.setAngularVelocity(this.platform.body.angularVelocity * 0.95);
        this.matter.world.on('beforeupdate', () => {
            this.matter.body.setAngularVelocity(this.player.body, 0);
            this.matter.body.setAngle(this.player.body, 0);
        });
        // Evitar rotaciones erraticas  de la plataforma
        if (this.platform.angle > 10.36) {
            this.platformFlag = true;
            this.platform.angle = 10.36;
            this.platform.angularVelocity = 0;
        }
        if (this.platform.angle < -10.36) {
            this.platformFlag = true;
            this.platform.angle = -10.36;
            this.platform.angularVelocity = 0;
        }
        if (this.platform.angle < 10.36 && this.platform.angle > -10.36) { this.platformFlag = false; }

        console.log(this.platform.angle);

        //Activar fisicas de jugador
        if (this.playerFlag) {
            this.playermatter();
        };

    }
    playermatter() {
        this.playerFlag = false;
        this.player.setIgnoreGravity(false);
        this.player.setCircle(); // Collider figura
        this.player.setDensity(0.2); // Efecto de peso
        this.player.setBounce(0.2);
        this.player.setFriction(0, 0);
        this.player.setVelocity(5, 5);
        this.player.setCollisionCategory(1); // Capa de colisión
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
                object = this.matter.add.sprite(randomX, 0, 'pointObj');
                object.setDisplaySize(20, 20);
                object.setBody({ type: 'circle', radius: 8 });
                object.objectType = 'points';
                this.objects.points.push(object);
                object.setCollisionCategory(this.pointCategory);
                object.setCollidesWith([this.playerCategory]);
                break;
            case 'damage':
                object = this.matter.add.sprite(randomX, 0, 'damageObj');
                object.setDisplaySize(20, 20);
                object.setBody({ type: 'circle', radius: 8 });
                object.objectType = 'damage';
                this.objects.damage.push(object);
                object.setCollisionCategory(this.pointCategory);
                object.setCollidesWith([this.playerCategory]);
                break;
            case 'health':
                object = this.matter.add.sprite(randomX, 0, 'healthObj');
                object.setDisplaySize(20, 20);
                object.setBody({ type: 'circle', radius: 8 });
                object.objectType = 'health';
                this.objects.health.push(object);
                object.setCollisionCategory(this.pointCategory);
                object.setCollidesWith([this.playerCategory]);
                break;
        }

        // Configurar física del objeto
        object.body.velocity.y = this.fallSpeed;
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