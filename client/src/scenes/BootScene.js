import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // No external assets – everything is drawn programmatically.
    // Show a simple loading bar.
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const bar = this.add.graphics();
    bar.fillStyle(0x4488FF).fillRect(w/2 - 150, h/2 - 10, 300 * 0, 20);

    this.load.on('progress', v => {
      bar.clear().fillStyle(0x4488FF).fillRect(w/2 - 150, h/2 - 10, 300 * v, 20);
    });
  }

  create() {
    // Init persistent game data
    if (!this.registry.has('unlockedLevels')) {
      this.registry.set('unlockedLevels', [1]);
    }
    this.scene.start('MainMenuScene');
  }
}
