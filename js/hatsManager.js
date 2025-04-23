export class hatsManager {
    constructor() {
        this.hatTypes = [
            {
                id: 1,
                name: "Casco Protector",
                description: "Bloquea 3 golpes por sombrero",
                rarity: "común",
                chance: 0.35, // 35% de probabilidad
                image: 'hat1'
            },
            {
                id: 2,
                name: "Sombrero Explosivo",
                description: "Genera una explosión cada 25 puntos (aumenta con cada sombrero)",
                rarity: "poco común",
                chance: 0.25, // 25% de probabilidad
                image: 'hat2'
            },
            {
                id: 3,
                name: "Gorra de la Suerte",
                description: "Aumenta el spawn de puntos en 5% por sombrero",
                rarity: "poco común",
                chance: 0.2, // 20% de probabilidad
                image: 'hat3'
            },
            {
                id: 4,
                name: "Sombrero Curativo",
                description: "Aumenta la vida máxima en 2 y cura 2 puntos",
                rarity: "raro",
                chance: 0.15, // 15% de probabilidad
                image: 'hat4'
            },
            {
                id: 5,
                name: "Corona Dorada",
                description: "¡Todos los puntos valen el doble!",
                rarity: "ultra raro",
                chance: 0.05, // 5% de probabilidad
                image: 'hat5'
            }
        ];

        this.ownedHats = {}; // Almacena los sombreros obtenidos por tipo { id: cantidad }
        this.totalHats = 0;
        this.pointMultiplier = 1; // Multiplicador de puntos (para el sombrero tipo 5)
        this.protectionRemaining = 0; // Golpes restantes protegidos (para el sombrero tipo 1)
        this.explosionCounter = 0; // Contador para la explosión (para el sombrero tipo 2)
        this.pointsToExplosion = 15; // Puntos necesarios para generar explosión
    }

    // Obtiene un sombrero aleatorio según las probabilidades
    getRandomHat() {
        // Verificar si todos los sombreros posibles ya fueron obtenidos
        if (this.areAllHatsMaxed()) {
            return this.showNoMoreHatsMessage();
        }

        // Verificar si solo falta el ultrararo (tipo 5)
        if (this.onlyMissingUltraRare()) {
            return this.addHat(5); // Forzar sombrero ultrararo
        }

        // Intentar conseguir un sombrero aleatorio
        const availableHats = this.hatTypes.filter(hat => {
            if (hat.id === 5) {
                return this.countHatsOfType(5) === 0; // El ultrararo solo puede salir una vez
            } else {
                return this.countHatsOfType(hat.id) < 5; // Los demás hasta 5 veces
            }
        });

        // Si no hay sombreros disponibles, retornar mensaje
        if (availableHats.length === 0) {
            return this.showNoMoreHatsMessage();
        }

        // Recalcular probabilidades solo con los sombreros disponibles
        const totalChance = availableHats.reduce((sum, hat) => sum + hat.chance, 0);
        const roll = Math.random() * totalChance;

        let accumulatedChance = 0;
        for (const hat of availableHats) {
            accumulatedChance += hat.chance;
            if (roll < accumulatedChance) {
                return this.addHat(hat.id);
            }
        }

        // Si por alguna razón llegamos aquí, devolvemos el primero disponible
        return this.addHat(availableHats[0].id);
    }

    areAllHatsMaxed() {
        // Verificar si todos los sombreros normales tienen 5 copias y el ultrararo 1
        const normalHatsMaxed = this.hatTypes
            .filter(hat => hat.id !== 5)
            .every(hat => this.countHatsOfType(hat.id) >= 5);

        const ultraRareObtained = this.countHatsOfType(5) === 1;

        return normalHatsMaxed && ultraRareObtained;
    }

    onlyMissingUltraRare() {
        // Verificar si solo falta el ultrararo
        const normalHatsMaxed = this.hatTypes
            .filter(hat => hat.id !== 5)
            .every(hat => this.countHatsOfType(hat.id) >= 5);

        const ultraRareNotObtained = this.countHatsOfType(5) === 0;

        return normalHatsMaxed && ultraRareNotObtained;
    }

    showNoMoreHatsMessage() {
        // Retornar un objeto para mostrar cuando ya no hay más sombreros
        return {
            id: -1,
            name: "¡Colección Completa!",
            description: "¡Has obtenido todos los sombreros posibles!",
            rarity: "legendario",
            image: this.hatTypes[0].image // Usar una imagen existente o crear una nueva
        };
    }

    // Agrega un sombrero al inventario y actualiza estadísticas
    addHat(hatId) {
        if (!this.ownedHats[hatId]) {
            this.ownedHats[hatId] = 0;
        }

        this.ownedHats[hatId]++;
        this.totalHats++;

        const hat = this.getHatById(hatId);

        // Aplicar efectos inmediatos
        this.applyHatEffects(hatId);

        return hat;
    }

    // Obtiene un sombrero por su ID
    getHatById(id) {
        return this.hatTypes.find(hat => hat.id === id);
    }

    // Cuenta cuántos sombreros de un tipo específico tenemos
    countHatsOfType(id) {
        return this.ownedHats[id] || 0;
    }

    // Aplica los efectos de un sombrero recién obtenido
    applyHatEffects(hatId) {
        switch (hatId) {
            case 1: // Protección
                this.protectionRemaining += 3; // 3 golpes protegidos por sombrero
                break;
            case 2: // Explosivo
                // Se maneja en el contador de puntos
                break;
            case 3: // Aumenta spawn de puntos
                // Se calcula dinámicamente cuando se necesita
                break;
            case 4: // Curación y aumento de vida máxima
                return {
                    healAmount: 2,
                    maxHealthIncrease: 2
                };
            case 5: // Multiplicador de puntos
                this.pointMultiplier = 2;
                break;
        }
        return null;
    }

    // Verifica si la protección bloquea un golpe
    useProtection() {
        if (this.protectionRemaining > 0) {
            this.protectionRemaining--;
            return true; // Golpe bloqueado
        }
        return false; // No hay protección
    }

    // Procesa los puntos y maneja efectos relacionados con puntos
    processPointCollection(currentPoints) {
        // Asegurarnos de que currentPoints sea un número válido
        currentPoints = isNaN(currentPoints) ? 0 : currentPoints;

        // Calcular explosión si tenemos sombreros tipo 2
        const type2Count = this.countHatsOfType(2);
        if (type2Count > 0) {
            this.explosionCounter++;
            if (this.explosionCounter >= this.pointsToExplosion) {
                this.explosionCounter = 0;
                return {
                    explosion: true,
                    size: 100 + (type2Count * 50), // Tamaño base + aumento por sombrero
                    multiplier: this.pointMultiplier
                };
            }
        }

        // Aplicar multiplicador de puntos (sombrero tipo 5)
        return {
            explosion: false,
            multiplier: this.pointMultiplier
        };
    }

    // Calcula el multiplicador de spawn para puntos (sombrero tipo 3)
    getPointSpawnRateMultiplier() {
        const type3Count = this.countHatsOfType(3);
        return 1 + (type3Count * 0.05); // Aumento del 5% por sombrero
    }

    // Obtiene la vida extra del sombrero tipo 4
    getExtraMaxHealth() {
        const type4Count = this.countHatsOfType(4);
        return type4Count * 2; // 2 puntos de vida extra por sombrero
    }

    // Reinicia las estadísticas para una nueva partida
    reset() {
        this.ownedHats = {};
        this.totalHats = 0;
        this.pointMultiplier = 1;
        this.protectionRemaining = 0;
        this.explosionCounter = 0;
    }
}