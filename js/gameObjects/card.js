export class Card {
    constructor(scene, position, callback, cardData) {
        this.name = 'cardBg';
        this.scene = scene;
        this.position = position;
        this.callback = callback;
        this.cardData = cardData;

        this.background = this.scene.add.sprite(position.x, position.y, this.name);
        this.background.setOrigin(0);
        this.background.setInteractive({ useHandCursor: true });
        this.background.on('pointerdown', this.onClick.bind(this));

        this.text = this.scene.add.text(position.x, position.y + 40, this.cardData.icon, {
            fontSize: '70px', align: 'center', fixedWidth: 100, fixedHeight: 70, padding: {
                left: 0,
                right: 0,
                top: 10,
                bottom: 0,
            },
        });
        this.text.visible = false;
    }

    onClick(value) {
        if (this.cardData.isDiscovered) return;
        this.callback(this);
    }

    destroy() {
        this.background.destroy();
        this.text.destroy();
    }
}