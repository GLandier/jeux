import Phaser from 'phaser';
import { GAME_WIDTH, SCREEN_HEIGHT, COLORS } from '../constants.js';
import { LEVEL_COUNT } from '../levels/LevelData.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelectScene'); }

  create(data) {
    this.multiplayer = data?.multiplayer ?? false;
    const W = GAME_WIDTH, H = SCREEN_HEIGHT;
    const unlocked = this.registry.get('unlockedLevels') || [1];

    // BG
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0A0A1A, 0x0A0A1A, 0x1A1A3E, 0x1A1A3E, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(W / 2, 60, 'CHOISIR UN NIVEAU', {
      fontSize: '36px', fontFamily: 'Arial Black', color: '#FFFFFF',
      stroke: '#4488FF', strokeThickness: 5,
    }).setOrigin(0.5);

    // Level cards
    const cardW = 200, cardH = 140, perRow = 4;
    const totalW = perRow * (cardW + 20) - 20;
    const startX = (W - totalW) / 2 + cardW / 2;
    const startY = 160;

    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const col = (i - 1) % perRow;
      const row = Math.floor((i - 1) / perRow);
      const cx  = startX + col * (cardW + 20);
      const cy  = startY + row * (cardH + 20);
      const isUnlocked = unlocked.includes(i);

      this._drawLevelCard(cx, cy, cardW, cardH, i, isUnlocked);
    }

    // Back button
    this._makeBackButton();
  }

  _drawLevelCard(cx, cy, w, h, lvlId, unlocked) {
    const g    = this.add.graphics();
    const r    = 10;
    const colorBg  = unlocked ? 0x1E3A5F : 0x1A1A2E;
    const colorBdr  = unlocked ? 0x4488FF : 0x334455;

    g.fillStyle(colorBg).fillRoundedRect(cx - w/2, cy - h/2, w, h, r);
    g.lineStyle(2, colorBdr).strokeRoundedRect(cx - w/2, cy - h/2, w, h, r);

    if (!unlocked) {
      // Lock icon
      g.fillStyle(0x444455);
      g.fillRect(cx - 12, cy - 10, 24, 20);
      g.fillStyle(0x666677);
      g.fillCircle(cx, cy - 14, 10);
      g.fillStyle(colorBg);
      g.fillCircle(cx, cy - 14, 6);
      this.add.text(cx, cy + 20, `Niveau ${lvlId}`, {
        fontSize: '16px', color: '#445566', fontFamily: 'Arial',
      }).setOrigin(0.5);
      return;
    }

    // Number badge
    g.fillStyle(0x4488FF);
    g.fillCircle(cx, cy - 28, 24);
    this.add.text(cx, cy - 28, String(lvlId), {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#FFFFFF',
    }).setOrigin(0.5);

    // Name placeholder (loaded from LevelData later)
    const names = ['Passage Étroit', 'Sous Pression', 'Feu et Eau'];
    this.add.text(cx, cy + 10, names[lvlId - 1] || `Niveau ${lvlId}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#AACCFF',
    }).setOrigin(0.5);

    // Stars (empty for now)
    for (let s = 0; s < 3; s++) {
      const sx = cx - 18 + s * 18;
      const star = this.add.graphics();
      star.fillStyle(0xFFDD00, 0.8);
      star.fillCircle(sx, cy + 38, 6);
    }

    // Click
    const zone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => { g.clear(); g.fillStyle(0x2A4E7F).fillRoundedRect(cx-w/2, cy-h/2, w, h, r); g.lineStyle(2, 0x88AAFF).strokeRoundedRect(cx-w/2, cy-h/2, w, h, r); });
    zone.on('pointerout',   () => { g.clear(); g.fillStyle(colorBg).fillRoundedRect(cx-w/2, cy-h/2, w, h, r); g.lineStyle(2, colorBdr).strokeRoundedRect(cx-w/2, cy-h/2, w, h, r); });
    zone.on('pointerup', () => {
      this.scene.start('GameScene', { levelId: lvlId, multiplayer: this.multiplayer });
    });
  }

  _makeBackButton() {
    const btn = this.add.text(20, 20, '← Retour', {
      fontSize: '20px', fontFamily: 'Arial', color: '#88AADD',
    }).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#FFFFFF'));
    btn.on('pointerout',  () => btn.setColor('#88AADD'));
    btn.on('pointerup',   () => this.scene.start('MainMenuScene'));
  }
}
