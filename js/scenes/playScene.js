import { hatsManager } from "../hatsManager.js";
import { GameManager } from "../gameManager.js";

export class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');

        // Solo mantén aquí variables que NO necesiten reiniciarse entre juegos
        // o configuraciones iniciales que sean constantes
    }

    init(data) {
        // Reiniciar todas las variables al iniciar la escena
        console.log('Iniciando PlayScene');
        this.player = null;
        this.platform = null;
        this.score = 0;
        this.unusedPoints = 0;
        this.health = 10;
        this.maxHealth = 10;
        this.hatButton = null;
        this.hatButtonText = null;
        this.explosionEffect = null;
        this.objects = {
            points: [],
            damage: [],
            health: []
        };
        this.spawnRates = {
            points: 0.7,
            damage: 0.2,
            health: 0.2
        };
        this.fallSpeed = 100;
        this.objectsToRemove = [];
        this.objectScale = 0.1;
        this.hatSlots = [];
        this.hatIcons = [];

        // Flags importantes
        this.clicked = false;
        this.playerFlag = false;
        this.platformFlag = false;
        this.gamePaused = false;
        this.spawnEvent = null;
        this.deletedIDFlag = null;
        this.explosionInProgress = false;
    }

    preload() {
        // Srpites
        this.load.image('cat', 'assets/newAssets/player.png');
        this.load.image('pointObj', 'assets/newAssets/pointObj.png');
        this.load.image('damageObj', 'assets/newAssets/damageObj.png');
        this.load.image('healthObj', 'assets/newAssets/healthObj.png');
        this.load.image('leftBtn', 'assets/images/Left.png');
        this.load.image('rightBtn', 'assets/images/Right.png');
        this.load.image('platformCorrected', 'assets/newAssets/platform.png');
        this.load.image('bottomLimit', 'assets/newAssets/bottomLimit.png');

        // Anim
        this.load.spritesheet('background', 'assets/newAssets/peceraBGanims.png', { frameWidth: 1366, frameHeight: 1024 });
        this.load.spritesheet('gacha', 'assets/newAssets/gachaAnim.png', { frameWidth: 235, frameHeight: 267 });

        // Cargar imágenes de sombreros
        this.load.image('hat1', 'assets/newAssets/protectiveHat.png');
        this.load.image('hat2', 'assets/newAssets/explosiveHat.png');
        this.load.image('hat3', 'assets/newAssets/luffyHat.png');
        this.load.image('hat4', 'assets/newAssets/healHat.png');
        this.load.image('hat5', 'assets/newAssets/ultraRareHat.png');

        this.load.image('hatButton', 'assets/images/hatButton.png');
        this.load.image('explosion', 'assets/newAssets/explosion.png');

        // Sonidos
        this.load.audio('pointSound', './assets/sound/point.mp3');
        this.load.audio('damageSound', './assets/sound/damage.mp3');
        this.load.audio('healthSound', './assets/sound/health.mp3');
        this.load.audio('hatSound', './assets/sound/hat.mp3'); // Asegúrate de tener este sonido
        this.load.audio('explosionSound', './assets/sound/explosion.mp3'); // Asegúrate de tener este sonido
    }

    create() {
        // Animaciones
        this.anims.create({
            key: 'backgroundAnim',
            frames: this.anims.generateFrameNumbers('background', { start: 0, end: 2 }),
            frameRate: 5,
            repeat: -1
        });
        this.anims.create({
            key: 'gachaAnim',
            frames: this.anims.generateFrameNumbers('gacha', { start: 0, end: 18 }),
            frameRate: 5,
            repeat: 1
        });
        this.add.sprite(683, 512, 'background').play('backgroundAnim');
        this.gachaSprite = this.add.sprite(1260, 350, 'gacha');
        this.gachaSprite.setInteractive();
        // Reset de hatsManager
        GameManager.instance.hatsManager.reset();

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
        this.deletedIDFlag; // Bandera para evitar que update elimine miles de veces el mismo objeto
        this.gamePaused = false;
        this.spawnEvent = null; // Evento de spawneo de objetos


        // Limites en pantalla de físicas
        this.matter.world.setBounds(21, 23, 1113, 1001, 20, true, true, true, true, {
            collisionFilter: {
                category: this.boundsCategory
            }
        });
        this.worldBoundsVariable = this.matter.world.bounds;

        // Zona de clickeo

        const leftZone = this.add.zone(300, 512, 552, 980);
        leftZone.setInteractive();

        const rightZone = this.add.zone(845, 512, 537, 980);
        rightZone.setInteractive();

        // Efectos de sonido
        this.pointSound = this.sound.add('pointSound');
        this.damageSound = this.sound.add('damageSound');
        this.healthSound = this.sound.add('healthSound');
        this.hatSound = this.sound.add('hatSound');
        this.explosionSound = this.sound.add('explosionSound');

        // Crear jugador (Las fisicas se declaran en el update llamando al metodo playermatter())
        this.player = this.matter.add.image(566, height - 300, 'cat').setDepth(5);
        this.player.setIgnoreGravity(true);
        this.player.setCollisionCategory(this.playerCategory);
        this.player.setCollidesWith(this.platformCategory || this.pointCategory); // Define con qué categorías puede colisionar

        // Límite inferior del mundo
        this.bottomLimit = this.matter.add.image(573, height, 'bottomLimit').setDepth(5);
        this.bottomLimit.setStatic(true);

        // Obtener tamaño del gato para redimensionar los otros objetos proporcionalmente
        this.catWidth = this.player.width;
        this.catHeight = this.player.height;

        // Crear plataforma y configurar colisiones
        this.platform = this.matter.add.sprite(683, 0, 'platformCorrected', null, {
            isStatic: false,
            density: 0.015,  // Efecto de peso
            frictionAir: 0.02
        });
        this.platform.setCollisionCategory(this.platformCategory);
        this.player.setCollidesWith(this.playerCategory);

        // Centro de gravedad (Ancla el objeto a un punto del mundo)
        this.matter.add.worldConstraint(this.platform, 0, 0.7, {
            pointA: { x: 573, y: 900 }, // Punto de anclaje en el mundo
            pointB: { x: 0, y: 0 }, // Posición del punto relativa a la posición de la plataforma
            stiffness: 0.9,
        });

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

        // Llama metodo para crear HUD
        this.createHUD();

        this.createHatSlots();

        // Crear botón de sombreros (inicialmente invisible)
        this.createHatButton();
        this.updateHatButton();
    }

    createHatSlots() {
        // Posición inicial para los slots 
        const startX = 1320;
        const startY = 960;
        const slotSize = 50; // Tamaño de cada slot
        const horizontalPadding = 2.5;
        const verticalPadding = 13;

        // Crear 17 slots (4 de cada tipo normal + 1 ultrararo)
        for (let i = 0; i < 17; i++) {
            // Calcular la posición en una cuadrícula de 5x4
            const row = Math.floor(i / 4);
            const col = i % 4;

            const x = startX - col * (slotSize + horizontalPadding);
            const y = startY - row * (slotSize + verticalPadding);

            // Crear un rectángulo 
            const slot = this.add.rectangle(x, y, slotSize, slotSize, 0x000000, 0)
                .setDepth(90);

            this.hatSlots.push(slot);
        }

        // Inicializar el array de iconos con nulls
        this.hatIcons = new Array(17).fill(null);
    }

    updateHatIcons() {
        const hatsManager = GameManager.instance.hatsManager;

        // Limpiar iconos existentes
        for (let i = 0; i < this.hatIcons.length; i++) {
            if (this.hatIcons[i]) {
                this.hatIcons[i].destroy();
                this.hatIcons[i] = null;
            }
        }

        // Primero manejamos el sombrero ultra raro (tipo 5) - siempre va en el slot 16
        if (hatsManager.countHatsOfType(5) > 0) {
            const ultraRareSlot = this.hatSlots[16];
            const hatIcon = this.add.image(ultraRareSlot.x, ultraRareSlot.y, 'hat5')
                .setScale(0.5)
                .setDepth(92);

            // Añadir un efecto brillante
            this.tweens.add({
                targets: hatIcon,
                alpha: { from: 0.7, to: 1 },
                scale: { from: 0.4, to: 0.5 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });

            this.hatIcons[16] = hatIcon;
        }

        for (let tipo = 1; tipo <= 4; tipo++) {
            const count = hatsManager.countHatsOfType(tipo);
            const filaInicio = (tipo - 1) * 4; // Índice de inicio para este tipo

            // Para cada sombrero de este tipo, crear un icono en su slot correspondiente
            for (let i = 0; i < count && i < 4; i++) {
                const slotIndex = filaInicio + i;
                const slot = this.hatSlots[slotIndex];

                // Crear el icono del sombrero
                const hatIcon = this.add.image(slot.x, slot.y, `hat${tipo}`)
                    .setScale(0.4)
                    .setDepth(91);

                // Añadir una animación de aparición
                this.tweens.add({
                    targets: hatIcon,
                    scale: { from: 0.2, to: 0.4 },
                    duration: 300,
                    ease: 'Back.easeOut'
                });

                this.hatIcons[slotIndex] = hatIcon;
            }
        }
    }

    update() {
        // Limpiar objetos que están fuera de la pantalla
        this.cleanupObjects();

        // Actualizar HUD
        this.updateHUD();

        // Actualizar botón de sombreros
        this.updateHatButton();

        // Relantizar plataforma despues de un movimiento
        this.platform.setAngularVelocity(this.platform.body.angularVelocity * 0.95);
        this.matter.world.on('beforeupdate', () => {
            this.matter.body.setAngularVelocity(this.player.body, 0);
            this.matter.body.setAngle(this.player.body, 0);
        });

        // Evitar rotaciones erraticas de la plataforma
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
        if (this.platform.angle < 10.36 && this.platform.angle > -10.36) {
            this.platformFlag = false;
        }

        // Activar fisicas de jugador y contador objetos
        if (this.playerFlag) {
            this.playermatter();

            // Solo crear el evento de spawneo una vez
            if (!this.spawnEvent) {
                this.spawnEvent = this.time.addEvent({
                    delay: 150,
                    callback: this.spawnObject,
                    callbackScope: this,
                    loop: true
                });
            }
        };

        // Colisiones entre objetos y jugador
        this.matter.world.on('collisionstart', (event) => {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA.gameObject;
                const bodyB = pairs[i].bodyB.gameObject;
                // Revisa si el objeto choca con limite inferior y lo agrega a la cola de objetos a eliminar
                if (bodyA === this.bottomLimit && (this.objects.points.includes(bodyB) || this.objects.damage.includes(bodyB) || this.objects.health.includes(bodyB))) {
                    this.objectsToRemove.push(bodyB);
                }
                // Revisa si el jugador choca con los objetos
                if (bodyA === this.player && this.objects.points.includes(bodyB) && this.deletedIDFlag !== bodyB) {
                    this.deletedIDFlag = bodyB;
                    this.matter.world.remove(bodyB);
                    this.collectPoints(bodyB);
                }
                else if (bodyA === this.player && this.objects.damage.includes(bodyB) && this.deletedIDFlag !== bodyB) {
                    this.deletedIDFlag = bodyB;
                    this.matter.world.remove(bodyB);
                    this.objectsToRemove.push(bodyB);
                    this.takeDamage(bodyB);
                }
                else if (bodyA === this.player && this.objects.health.includes(bodyB) && this.deletedIDFlag !== bodyB) {
                    this.deletedIDFlag = bodyB;
                    this.matter.world.remove(bodyB);
                    this.objectsToRemove.push(bodyB);
                    this.gainHealth(bodyB);
                }
            }
        });

        // Verificar si el jugador ha perdido
        if (this.health <= 0) {
            this.gameOver();
        }
    }

    playermatter() {
        this.playerFlag = false;
        this.player.setIgnoreGravity(false);
        this.player.setCircle(); // Collider figura
        this.player.setDensity(0.05); // Efecto de peso
        this.player.setBounce(0.2);
        this.player.setFriction(0, 0);
        this.player.setVelocity(5, 5);
        this.player.setCollisionCategory(1); // Capa de colisión
    }

    createHUD() {
        // Texto de puntuación
        this.scoreText = this.add.text(
            30, 40,
            `Puntos: ${this.score}`,
            { fontSize: '15px', fill: '#000' }
        );

        /* Texto de puntos sin usar
        this.unusedPointsText = this.add.text(
            20, 50,
            `: ${this.unusedPoints}`,
            { fontSize: '15px', fill: '#000' }
        ); */

        // Texto de salud
        this.healthText = this.add.text(
            30, 90,
            `Salud: ${this.health}/${this.maxHealth}`,
            { fontSize: '15px', fill: '#000' }
        );

        // Texto de sombreros
        this.hatsText = this.add.text(
            30, 125,
            `Sombreros: ${GameManager.instance.hatsManager.totalHats}`,
            { fontSize: '15px', fill: '#000' }
        );

        // Texto de protección
        this.protectionText = this.add.text(
            30, 145,
            `Protección: ${GameManager.instance.hatsManager.protectionRemaining}`,
            { fontSize: '15px', fill: '#000' }
        );
    }

    updateHUD() {
        this.scoreText.setText(`Puntos: ${this.score}`);
        //  this.unusedPointsText.setText(`Puntos sin usar: ${this.unusedPoints}`);
        this.healthText.setText(`Salud: ${this.health}/${this.maxHealth}`);
        this.hatsText.setText(`Sombreros: ${GameManager.instance.hatsManager.totalHats}`);
        this.protectionText.setText(`Protección: ${GameManager.instance.hatsManager.protectionRemaining}`);

        // Actualizar los iconos de sombreros
        this.updateHatIcons();
    }

    createHatButton() {
        const width = GameManager.instance.width;
        // Evento de click en el botón
        this.gachaSprite.on('pointerdown', () => {
            if (this.unusedPoints >= 20) {
                this.getNewHat();
            }
        });
    }

    updateHatButton() {
        // Mostrar u ocultar el botón según los puntos no usados
        const visible = this.unusedPoints >= 20;


        if (visible) {
            // Hacer que el botón destaque
            if (!this.hatButtonTween) {
                this.hatButtonTween = this.tweens.add({
                    targets: [this.gachaSprite],
                    angle: { from: -5, to: 5 },
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
            }
        } else if (this.hatButtonTween) {
            this.hatButtonTween.stop();
            this.hatButtonTween = null;
            this.gachaSprite.angle = 0;
        }
    }

    getNewHat() {
        this.gachaSprite.play('gachaAnim'); // Reproducir animación de gacha
        setTimeout(() => {
            this.gachaSprite.stop();
            if (this.unusedPoints >= 20) {
                // Verificar si todos los sombreros ya fueron obtenidos
                if (GameManager.instance.hatsManager.areAllHatsMaxed()) {
                    this.showFloatingText(
                        this.player.x,
                        this.player.y - 50,
                        "¡Ya tienes todos los sombreros!",
                        0xFFD700
                    );
                    return; // No hacer nada más
                }

                this.unusedPoints -= 20;

                // Pausar el juego antes de mostrar el sombrero
                this.pauseGameSafely();

                // Obtener un sombrero aleatorio
                const hat = GameManager.instance.hatsManager.getRandomHat();

                // Si es un mensaje especial (id = -1), mostrar mensaje especial
                if (hat.id === -1) {
                    this.showFloatingText(
                        this.player.x,
                        this.player.y - 50,
                        "¡Colección de sombreros completa!",
                        0xFFD700
                    );
                    this.resumeGameSafely();
                    return;
                }

                // Reproducir sonido
                this.hatSound.play();

                // Mostrar mensaje con el sombrero obtenido
                this.showHatMessage(hat);

                // Actualizar HUD y efectos
                this.updatePlayerStats();

                this.updateHatIcons();
            }
        }, 1000);
    }

    showHatMessage(hat) {
        const width = GameManager.instance.width;
        const height = GameManager.instance.height;

        // Primero, detener el spawneo de objetos
        if (this.spawnEvent && this.spawnEvent.paused === false) {
            this.spawnEvent.paused = true;
        }

        // Contenedor para el mensaje
        const container = this.add.container(width / 2, height / 2).setDepth(100);

        // Fondo del mensaje
        const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8)
            .setStrokeStyle(4, 0xFFD700);
        container.add(bg);

        // Título
        const title = this.add.text(0, -120, '', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#FFD700',
            align: 'center',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);
        container.add(title);

        // Imagen del sombrero
        const hatImage = this.add.image(0, -40, hat.image).setScale(1.5);
        container.add(hatImage);

        // Nombre del sombrero
        const nameText = this.add.text(0, 40, hat.name, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);
        container.add(nameText);

        // Rareza del sombrero
        const rarityText = this.add.text(0, 70, `Rareza: ${hat.rarity}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: hat.id === 5 ? '#FFD700' : '#AAAAAA',
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        container.add(rarityText);

        // Descripción del sombrero
        const descText = this.add.text(0, 100, hat.description, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            align: 'center',
            wordWrap: { width: 380 }
        }).setOrigin(0.5);
        container.add(descText);

        // Variable para rastrear si el juego está pausado
        this.gamePaused = true;

        // Botón para cerrar
        const closeBtn = this.add.text(bg.width / 2 - 30, -bg.height / 2 + 30, 'X', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        container.add(closeBtn);

        // Evento para cerrar el mensaje de forma segura
        closeBtn.on('pointerdown', () => {
            // Primero destruir el contenedor
            container.destroy();

            // Luego reanudar el juego
            this.resumeGameSafely();
        });
    }

    // Método nuevo para manejar la pausa del juego de forma segura
    pauseGameSafely() {
        this.gamePaused = true;

        // Pausar el spawneo de objetos
        if (this.spawnEvent) {
            this.spawnEvent.paused = true;
        }

        // Pausar físicas si es posible
        try {
            if (this.matter && this.matter.world) {
                this.matter.pause();
            }
        } catch (e) {
            console.log("Error al pausar matter:", e);
        }

        // Pausar todas las físicas
        try {
            if (this.physics) {
                this.physics.pause();
            }
        } catch (e) {
            console.log("Error al pausar physics:", e);
        }
    }

    // Método nuevo para manejar la reanudación del juego de forma segura
    resumeGameSafely() {
        if (!this.gamePaused) return; // Evitar doble reanudación

        this.gamePaused = false;

        // Reanudar el spawneo de objetos
        if (this.spawnEvent) {
            this.spawnEvent.paused = false;
        }

        // Reanudar físicas si es posible
        try {
            if (this.matter && this.matter.world) {
                this.matter.resume();
            }
        } catch (e) {
            console.log("Error al reanudar matter:", e);
        }

        // Reanudar todas las físicas
        try {
            if (this.physics) {
                this.physics.resume();
            }
        } catch (e) {
            console.log("Error al reanudar physics:", e);
        }
    }

    updatePlayerStats() {
        // Actualizar vida máxima si se obtuvo un sombrero curativo (tipo 4)
        const extraHealth = GameManager.instance.hatsManager.getExtraMaxHealth();
        this.maxHealth = 10 + extraHealth;

        // Actualizar tasas de spawn si se obtuvo un sombrero de suerte (tipo 3)
        const pointSpawnMultiplier = GameManager.instance.hatsManager.getPointSpawnRateMultiplier();
        this.spawnRates.points = Math.min(0.6 * pointSpawnMultiplier, 0.85); // Limitar a 85% máximo

        // Ajustar otras tasas proporcionalmente
        const remainingRate = 1 - this.spawnRates.points;
        this.spawnRates.damage = remainingRate * 0.6; // 60% del restante
        this.spawnRates.health = remainingRate * 0.4; // 40% del restante
    }

    spawnObject() {
        const width = GameManager.instance.width;
        const randomX = Phaser.Math.Between(23, 1092);
        const randomType = this.getRandomObjectType();
        let object;

        switch (randomType) {
            case 'points':
                object = this.matter.add.sprite(randomX, 23, 'pointObj');
                object.setDisplaySize(20, 20);
                object.setBody({ type: 'circle', radius: 8 });
                object.objectType = 'points';
                this.objects.points.push(object);
                object.setCollisionCategory(this.pointCategory);
                object.setCollidesWith([this.playerCategory]);
                break;
            case 'damage':
                object = this.matter.add.sprite(randomX, 23, 'damageObj');
                object.setDisplaySize(20, 20);
                object.setBody({ type: 'circle', radius: 8 });
                object.objectType = 'damage';
                this.objects.damage.push(object);
                object.setCollisionCategory(this.pointCategory);
                object.setCollidesWith([this.playerCategory]);
                break;
            case 'health':
                object = this.matter.add.sprite(randomX, 23, 'healthObj');
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

    collectPoints(object, checkExplosion = true) {
        // Asegurarnos de que el objeto aún existe antes de procesarlo
        if (!object || !object.active) return;

        // Procesar punto con los efectos de sombreros
        const pointResult = GameManager.instance.hatsManager.processPointCollection(this.score);

        // Asegurarnos de que el multiplicador sea un número válido
        const multiplier = isNaN(pointResult.multiplier) ? 1 : pointResult.multiplier;

        // Sumar puntos según multiplicador
        const pointValue = 1 * multiplier;

        // Validar que los valores sean números antes de sumarlos
        if (!isNaN(pointValue)) {
            this.score += pointValue;
            this.unusedPoints += pointValue;
        }

        // Reproducir sonido
        this.pointSound.play();

        // Verificar si hay explosión (sombrero tipo 2) solo si checkExplosion es true
        if (checkExplosion && pointResult.explosion && !this.explosionInProgress) {
            this.explosionInProgress = true;
            this.createExplosion(this.player.x, this.player.y, pointResult.size);
            // Restablecer el indicador después de un tiempo
            this.time.delayedCall(700, () => {
                this.explosionInProgress = false;
            });
        }

        // Remover el objeto
        this.removeObject(object);
    }

    takeDamage(object) {
        // Verificar si hay protección de sombrero
        if (GameManager.instance.hatsManager.useProtection()) {
            // El golpe fue bloqueado
            this.showFloatingText(this.player.x, this.player.y - 30, '¡PROTEGIDO!', 0x00FF00);
        } else {
            // Reducir vida
            this.health--;
            this.damageSound.play();
            this.cameras.main.shake(200, 0.005); // Efecto de sacudida
        }

        // Remover el objeto
        this.removeObject(object);
    }

    gainHealth(object) {
        // Recuperar 1 punto de vida, máximo según los sombreros
        this.health = Math.min(this.health + 1, this.maxHealth);
        this.healthSound.play();

        // Mostrar texto flotante
        this.showFloatingText(this.player.x, this.player.y - 30, '+1 Salud', 0x00FF00);

        // Remover el objeto
        this.removeObject(object);
    }

    createExplosion(x, y, size) {
        // Efecto visual de explosión
        this.explosionEffect = this.add.image(x, y, 'explosion')
            .setScale(0.1)
            .setAlpha(0.8)
            .setDepth(10);

        // Reproducir sonido de explosión
        this.explosionSound.play();

        // Animación de la explosión
        this.tweens.add({
            targets: this.explosionEffect,
            scale: size / 100, // Escala según el tamaño
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.explosionEffect.destroy();
            }
        });

        // Eliminar objetos dañinos dentro del radio de explosión
        const explosionRadius = size;
        for (const damageObj of this.objects.damage) {
            const distance = Phaser.Math.Distance.Between(x, y, damageObj.x, damageObj.y);
            if (distance < explosionRadius) {
                this.removeObject(damageObj);
            }
        }
    }

    showFloatingText(x, y, message, color = 0xFFFFFF) {
        const text = this.add.text(x, y, message, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Animación del texto flotante
        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                text.destroy();
            }
        });
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
            if (obj.destroy) {
                obj.destroy();
            }
            if (obj.body && this.matter.world) {
                this.matter.world.remove(obj);
            }
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

    increaseDifficulty() {
        // Aumentar velocidad de caída
        this.fallSpeed += 10;

        // Aumenta el spawn de objetos dañinos
        const basePointRate = 0.6 * GameManager.instance.hatsManager.getPointSpawnRateMultiplier();
        this.spawnRates.points = Math.min(basePointRate, 0.85);

        // Ajustar otras tasas proporcionalmente, favoreciendo los dañinos conforme avanza
        const remainingRate = 1 - this.spawnRates.points;
        const damageRatio = Math.min(0.6 + (this.score / 300) * 0.2, 0.8); // Aumenta gradualmente hasta 80%
        this.spawnRates.damage = remainingRate * damageRatio;
        this.spawnRates.health = remainingRate * (1 - damageRatio);

        // Notification
        this.showFloatingText(
            GameManager.instance.width / 2,
            200,
            '¡AUMENTA LA DIFICULTAD!',
            0xFF5500
        );
    }

    gameOver() {
        // Guardar puntaje
        const finalScore = this.score;
        const totalHats = GameManager.instance.hatsManager.totalHats;

        // Mostrar pantalla de fin
        this.scene.start('EndScene', {
            score: finalScore,
            hats: totalHats
        });
    }

    createExplosion(x, y, size) {
        // Efecto visual de explosión
        this.explosionEffect = this.add.image(x, y, 'explosion')
            .setScale(0.1)
            .setAlpha(0.8)
            .setDepth(10);

        // Reproducir sonido de explosión
        this.explosionSound.play();

        // Animación de la explosión
        this.tweens.add({
            targets: this.explosionEffect,
            scale: size / 100, // Escala según el tamaño
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.explosionEffect.destroy();
            }
        });

        // Guardar el tamaño original del jugador
        const originalScale = this.player.scale;

        // IMPORTANTE: No modificamos directamente el collider, solo recolectamos objetos en el radio

        // Crear un array para recolectar todos los objetos afectados
        const objectsToCollect = [];

        // Identificar objetos cercanos dentro del radio de explosión
        const explosionRadius = size;

        // Recolectar puntos dentro del radio
        for (const pointObj of this.objects.points) {
            const distance = Phaser.Math.Distance.Between(x, y, pointObj.x, pointObj.y);
            if (distance < explosionRadius) {
                objectsToCollect.push(pointObj);
            }
        }

        // Eliminar objetos dañinos dentro del radio
        for (const damageObj of this.objects.damage) {
            const distance = Phaser.Math.Distance.Between(x, y, damageObj.x, damageObj.y);
            if (distance < explosionRadius) {
                this.removeObject(damageObj);
            }
        }

        // Recolectar vida dentro del radio
        for (const healthObj of this.objects.health) {
            const distance = Phaser.Math.Distance.Between(x, y, healthObj.x, healthObj.y);
            if (distance < explosionRadius) {
                objectsToCollect.push(healthObj);
            }
        }

        // Visual feedback - hacer que el jugador parpadee brevemente
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            yoyo: true,
            duration: 100,
            repeat: 1,
            onComplete: () => {
                this.player.alpha = 1;
            }
        });

        // Procesar todos los objetos recolectados de inmediato
        for (const obj of objectsToCollect) {
            if (obj.objectType === 'points') {
                this.collectPoints(obj, false); // Pasamos false para evitar recursión infinita
            } else if (obj.objectType === 'health') {
                this.gainHealth(obj);
            }
        }

        // Mostrar texto flotante indicando el número de objetos recolectados
        if (objectsToCollect.length > 0) {
            this.showFloatingText(
                x, y - 30,
                `¡${objectsToCollect.length} objetos!`,
                0xFFD700
            );
        }
    }
}