import Phaser from 'phaser';
import { GAME_WIDTH, SCREEN_HEIGHT, COLORS } from '../constants.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    const W = GAME_WIDTH, H = SCREEN_HEIGHT;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0A0A1A, 0x0A0A1A, 0x1A1A3E, 0x1A1A3E, 1);
    bg.fillRect(0, 0, W, H);

    // Animated background tiles (decorative)
    this._particles = [];
    for (let i = 0; i < 20; i++) {
      const p = this.add.graphics();
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.Between(2, 8);
      p.fillStyle(0x4488FF, 0.2);
      p.fillCircle(0, 0, r);
      p.x = x; p.y = y;
      this._particles.push(p);
      this.tweens.add({
        targets: p, y: y - Phaser.Math.Between(50, 200),
        alpha: 0, duration: Phaser.Math.Between(2000, 5000),
        repeat: -1, delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => { p.x = Phaser.Math.Between(0, W); p.y = y; p.alpha = 0.2; },
      });
    }

    // Title
    this.add.text(W / 2, 160, 'MORPHIA', {
      fontSize: '72px', fontFamily: 'Arial Black, sans-serif',
      color: '#FFFFFF', stroke: '#4488FF', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(W / 2, 235, 'Le jeu des transformations', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif',
      color: '#88AADD',
    }).setOrigin(0.5);

    // Transform icons preview
    this._drawTransformPreview(W / 2, 310);

    // Buttons
    this._makeButton(W / 2, 430, '  SOLO  ', () => {
      this.scene.start('LevelSelectScene', { multiplayer: false });
    }, 0x2266CC, 0x4488FF);

    this._makeButton(W / 2, 520, '  MULTIJOUEUR  ', () => {
      this.scene.start('MultiLobbyScene');
    }, 0x226622, 0x44AA44);

    // Version
    this.add.text(W - 10, H - 10, 'v0.1', {
      fontSize: '12px', color: '#445566',
    }).setOrigin(1, 1);
  }

  _drawTransformPreview(cx, cy) {
    const forms = [
      { name: 'Normal', color: 0x4488FF }, { name: 'Feuille', color: 0x44CC44 },
      { name: 'Pierre',  color: 0x999999 }, { name: 'Eau',    color: 0x2266EE },
      { name: 'Oiseau', color: 0xFFDD00 },
    ];
    const spacing = 120;
    const startX  = cx - (forms.length - 1) * spacing / 2;

    forms.forEach((f, i) => {
      const x = startX + i * spacing;
      const g = this.add.graphics();
      g.fillStyle(f.color, 0.9);
      g.fillCircle(x, cy, 22);
      g.lineStyle(2, 0xFFFFFF, 0.4);
      g.strokeCircle(x, cy, 22);
      this.add.text(x, cy + 32, f.name, {
        fontSize: '13px', color: '#AACCEE', fontFamily: 'Arial',
      }).setOrigin(0.5);

      // Pulse animation
      this.tweens.add({
        targets: g, alpha: 0.5, duration: 1000, yoyo: true,
        repeat: -1, delay: i * 200, ease: 'Sine.InOut',
      });
    });
  }

  _makeButton(x, y, label, callback, colorBg, colorHover) {
    const btn = this.add.graphics();
    const tw = 220, th = 54, r = 12;

    const draw = (col) => {
      btn.clear();
      btn.fillStyle(col, 1);
      btn.fillRoundedRect(-tw / 2, -th / 2, tw, th, r);
      btn.lineStyle(2, 0xFFFFFF, 0.3);
      btn.strokeRoundedRect(-tw / 2, -th / 2, tw, th, r);
    };

    btn.x = x; btn.y = y;
    draw(colorBg);

    const txt = this.add.text(x, y, label, {
      fontSize: '24px', fontFamily: 'Arial Black, sans-serif', color: '#FFFFFF',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, tw, th).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => draw(colorHover));
    zone.on('pointerout',   () => draw(colorBg));
    zone.on('pointerdown',  () => {
      this.tweens.add({ targets: [btn, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true });
    });
    zone.on('pointerup', callback);
  }
}
