import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UI_HEIGHT, SCREEN_HEIGHT, COLORS, TRANSFORM_INFO } from '../constants.js';

const BAR_Y = GAME_HEIGHT;

export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  init(data) {
    this.levelName         = data.levelName          ?? '';
    this.levelId           = data.levelId            ?? 1;
    this.unlockedTransforms = data.unlockedTransforms ?? ['normal'];
    this.hint              = data.hint               ?? '';
    this.currentTransform  = this.unlockedTransforms[0];
  }

  create() {
    const W = GAME_WIDTH;

    // ── Background bar ────────────────────────────────────────────────────────
    const bar = this.add.graphics();
    bar.fillStyle(COLORS.UI_BG, 1);
    bar.fillRect(0, BAR_Y, W, UI_HEIGHT);
    bar.lineStyle(1, COLORS.UI_BORDER, 1);
    bar.lineBetween(0, BAR_Y, W, BAR_Y);

    // ── Level name ────────────────────────────────────────────────────────────
    this.add.text(14, BAR_Y + 8, `Niveau ${this.levelId} – ${this.levelName}`, {
      fontSize: '16px', fontFamily: 'Arial', color: '#AACCFF',
    });

    // ── Controls hint ─────────────────────────────────────────────────────────
    this.add.text(W - 14, BAR_Y + 8, 'ZQSD / Flèches : Bouger   Q/E : Transformer   R : Recommencer   ESC : Menu', {
      fontSize: '12px', fontFamily: 'Arial', color: '#445566',
    }).setOrigin(1, 0);

    // ── Transform slots ───────────────────────────────────────────────────────
    this._slotGfx     = [];
    this._slotLabels  = [];

    const allTransforms = ['normal', 'leaf', 'stone', 'water', 'bird'];
    const slotSize = 56, spacing = 8;
    const totalW   = allTransforms.length * (slotSize + spacing) - spacing;
    const startX   = (W - totalW) / 2;

    allTransforms.forEach((t, i) => {
      const sx = startX + i * (slotSize + spacing);
      const sy = BAR_Y + UI_HEIGHT / 2 + 4;

      const isUnlocked = this.unlockedTransforms.includes(t);
      const isCurrent  = t === this.currentTransform;
      const info = TRANSFORM_INFO[t];

      // Slot background
      const g = this.add.graphics();
      this._slotGfx.push(g);
      this._drawSlot(g, sx, sy, slotSize, t, isUnlocked, isCurrent);

      // Number label
      if (isUnlocked) {
        this.add.text(sx + 4, sy - slotSize/2 + 3, String(i + 1), {
          fontSize: '11px', fontFamily: 'Arial', color: '#88AABB',
        });
      }

      // Name label
      const lbl = this.add.text(sx + slotSize/2, sy + slotSize/2 + 3, isUnlocked ? info.name : '???', {
        fontSize: '12px', fontFamily: 'Arial',
        color: isUnlocked ? '#AADDFF' : '#445566',
      }).setOrigin(0.5, 0);
      this._slotLabels.push(lbl);
    });

    this._allTransforms = allTransforms;

    // ── Listen for game events ────────────────────────────────────────────────
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.on('transformChanged', (t, available) => {
        this.currentTransform = t;
        this._refreshSlots(available);
      });
    }
  }

  _drawSlot(g, sx, sy, size, transform, isUnlocked, isCurrent) {
    g.clear();
    const info = TRANSFORM_INFO[transform];
    const r    = 8;
    const halfS = size / 2;

    // Slot BG
    if (isCurrent && isUnlocked) {
      g.fillStyle(info.color, 0.25);
      g.fillRoundedRect(sx, sy - halfS, size, size, r);
      g.lineStyle(2, info.color, 1);
      g.strokeRoundedRect(sx, sy - halfS, size, size, r);
    } else if (isUnlocked) {
      g.fillStyle(0x1E2A3A, 1);
      g.fillRoundedRect(sx, sy - halfS, size, size, r);
      g.lineStyle(1, 0x334455, 1);
      g.strokeRoundedRect(sx, sy - halfS, size, size, r);
    } else {
      g.fillStyle(0x111118, 1);
      g.fillRoundedRect(sx, sy - halfS, size, size, r);
      g.lineStyle(1, 0x223333, 0.5);
      g.strokeRoundedRect(sx, sy - halfS, size, size, r);
      // Lock icon
      g.fillStyle(0x334444, 1);
      g.fillCircle(sx + halfS, sy - 4, 8);
      g.fillStyle(0x112222, 1);
      g.fillCircle(sx + halfS, sy - 4, 5);
      g.fillRect(sx + halfS - 5, sy + 1, 10, 8);
      return;
    }

    // Icon (small shape)
    const cx = sx + halfS, cy = sy;
    const iconR = 13;
    g.fillStyle(isUnlocked ? info.color : 0x445566, isCurrent ? 1 : 0.6);

    switch (transform) {
      case 'normal': g.fillCircle(cx, cy, iconR); break;
      case 'leaf':   g.fillEllipse(cx, cy, iconR * 2.2, iconR * 0.85); break;
      case 'stone':  g.fillRoundedRect(cx - iconR, cy - iconR, iconR * 2, iconR * 2, 3); break;
      case 'water':  g.fillCircle(cx, cy + 2, iconR * 0.85); g.fillTriangle(cx, cy - iconR, cx - iconR * 0.5, cy, cx + iconR * 0.5, cy); break;
      case 'bird':   g.fillEllipse(cx, cy + 2, iconR * 1.3, iconR); g.fillTriangle(cx - iconR * 1.2, cy - 2, cx - iconR * 0.4, cy + 3, cx - iconR * 0.4, cy - 7); g.fillTriangle(cx + iconR * 1.2, cy - 2, cx + iconR * 0.4, cy + 3, cx + iconR * 0.4, cy - 7); break;
    }
  }

  _refreshSlots(available) {
    this._allTransforms.forEach((t, i) => {
      const isUnlocked = available.includes(t);
      const isCurrent  = t === this.currentTransform;
      const slotSize = 56, spacing = 8;
      const totalW   = this._allTransforms.length * (slotSize + spacing) - spacing;
      const startX   = (GAME_WIDTH - totalW) / 2;
      const sx = startX + i * (slotSize + spacing);
      const sy = GAME_HEIGHT + UI_HEIGHT / 2 + 4;
      this._drawSlot(this._slotGfx[i], sx, sy, slotSize, t, isUnlocked, isCurrent);
    });
  }
}
