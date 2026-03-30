import { TILE_SIZE, TILE, TRANSFORM_INFO, MOVE_DURATION } from '../constants.js';

export class Player {
  constructor(scene, tileX, tileY, transform = 'normal', isRemote = false) {
    this.scene    = scene;
    this.tileX    = tileX;
    this.tileY    = tileY;
    this.transform = transform;
    this.isRemote  = isRemote;
    this.isMoving  = false;

    this.container = scene.add.container(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
    );
    this.gfx = scene.add.graphics();
    this.container.add(this.gfx);
    this.container.setDepth(10);
    this._draw();
  }

  // ─── Drawing ────────────────────────────────────────────────────────────────

  _draw() {
    const g = this.gfx;
    g.clear();
    const info = TRANSFORM_INFO[this.transform];
    const r    = TILE_SIZE * 0.34;
    const c    = this.isRemote ? 0xFF6666 : info.color;
    const dc   = this.isRemote ? 0xAA2222 : info.darkColor;

    g.lineStyle(2, dc, 1);
    g.fillStyle(c, 1);

    switch (this.transform) {
      case 'normal':
        g.fillCircle(0, 0, r);
        g.strokeCircle(0, 0, r);
        break;
      case 'leaf': {
        // Flat wide ellipse
        const hw = r * 1.4, hh = r * 0.55;
        g.fillEllipse(0, 0, hw * 2, hh * 2);
        g.strokeEllipse(0, 0, hw * 2, hh * 2);
        // Leaf vein
        g.lineStyle(1, dc, 0.7);
        g.beginPath(); g.moveTo(-hw * 0.8, 0); g.lineTo(hw * 0.8, 0); g.strokePath();
        break;
      }
      case 'stone': {
        const s = r * 1.15;
        g.fillRoundedRect(-s, -s, s * 2, s * 2, 4);
        g.strokeRoundedRect(-s, -s, s * 2, s * 2, 4);
        // Cracks
        g.lineStyle(1, dc, 0.5);
        g.beginPath(); g.moveTo(-4, -s * 0.6); g.lineTo(2, 0); g.lineTo(-2, s * 0.4); g.strokePath();
        break;
      }
      case 'water': {
        // Water drop shape
        g.fillCircle(0, r * 0.2, r * 0.9);
        g.strokeCircle(0, r * 0.2, r * 0.9);
        g.fillTriangle(0, -r * 1.05, -r * 0.55, r * 0.2, r * 0.55, r * 0.2);
        g.lineStyle(1, c, 0.3);
        g.fillStyle(0xAADDFF, 0.5);
        g.fillCircle(-r * 0.25, r * 0.1, r * 0.22);
        break;
      }
      case 'bird': {
        // Body
        g.fillEllipse(0, r * 0.1, r * 1.4, r * 1.0);
        g.strokeEllipse(0, r * 0.1, r * 1.4, r * 1.0);
        // Wings (two triangles)
        g.fillStyle(c, 0.8);
        g.fillTriangle(-r * 1.4, -r * 0.2, -r * 0.5, r * 0.4, -r * 0.5, -r * 0.6);
        g.fillTriangle( r * 1.4, -r * 0.2,  r * 0.5, r * 0.4,  r * 0.5, -r * 0.6);
        break;
      }
    }

    // Eyes (only if not leaf or stone)
    if (this.transform !== 'leaf') {
      const eyeOffX = this.transform === 'bird' ? 6 : 5;
      const eyeOffY = this.transform === 'water' ? -r * 0.4 : -r * 0.3;
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(-eyeOffX, eyeOffY, 4);
      g.fillCircle( eyeOffX, eyeOffY, 4);
      g.fillStyle(0x111111, 1);
      g.fillCircle(-eyeOffX + 1, eyeOffY, 2);
      g.fillCircle( eyeOffX + 1, eyeOffY, 2);
    }

    // Remote player indicator
    if (this.isRemote) {
      g.fillStyle(0xFF4444, 1);
      g.fillTriangle(-6, -r * 1.5, 6, -r * 1.5, 0, -r * 1.1);
    }
  }

  // ─── Movement ───────────────────────────────────────────────────────────────

  tryMove(dx, dy, levelData, onComplete) {
    if (this.isMoving) return false;
    const nx = this.tileX + dx;
    const ny = this.tileY + dy;

    if (!this._canMoveTo(nx, ny, levelData)) return false;

    this.tileX = nx;
    this.tileY = ny;
    this.isMoving = true;

    this.scene.tweens.add({
      targets: this.container,
      x: nx * TILE_SIZE + TILE_SIZE / 2,
      y: ny * TILE_SIZE + TILE_SIZE / 2,
      duration: MOVE_DURATION,
      ease: 'Sine.Out',
      onComplete: () => {
        this.isMoving = false;
        this._onLanded(levelData);
        if (onComplete) onComplete(nx, ny);
      },
    });

    // Face direction (flip for left/right)
    if (dx !== 0) this.container.scaleX = dx < 0 ? -1 : 1;

    return true;
  }

  _canMoveTo(nx, ny, levelData) {
    const { MAP_COLS, MAP_ROWS } = { MAP_COLS: 20, MAP_ROWS: 14 };
    if (nx < 0 || nx >= 20 || ny < 0 || ny >= 14) return false;

    const tile = levelData.grid[ny][nx];
    const info = TRANSFORM_INFO[this.transform];

    // Doors: open if in openDoors set
    if (tile === TILE.DOOR) {
      const key = `${ny},${nx}`;
      return levelData.openDoors.has(key);
    }

    return info.canPass.has(tile);
  }

  _onLanded(levelData) {
    const tile = levelData.grid[this.tileY][this.tileX];
    const info = TRANSFORM_INFO[this.transform];

    // Wind push
    if (info.windAffected) {
      if (tile === TILE.WIND_R) { setTimeout(() => this.tryMove( 1, 0, levelData), 60); return; }
      if (tile === TILE.WIND_L) { setTimeout(() => this.tryMove(-1, 0, levelData), 60); return; }
      if (tile === TILE.WIND_U) { setTimeout(() => this.tryMove( 0,-1, levelData), 60); return; }
      if (tile === TILE.WIND_D) { setTimeout(() => this.tryMove( 0, 1, levelData), 60); return; }
    }

    // Pressure plate
    if (tile === TILE.PLATE && info.activatesPlate) {
      this.scene.events.emit('plateActivated', this.tileX, this.tileY, this);
    }

    // Fire extinguish
    if (tile === TILE.FIRE && info.extinguishesFire) {
      levelData.grid[this.tileY][this.tileX] = TILE.FLOOR;
      this.scene.events.emit('tileChanged', this.tileX, this.tileY);
    }

    // Exit
    if (tile === TILE.EXIT) {
      this.scene.events.emit('playerReachedExit', this);
    }
  }

  // ─── Transformation ──────────────────────────────────────────────────────────

  setTransform(transform) {
    this.transform = transform;
    this._draw();
    // Small pop animation
    this.scene.tweens.add({
      targets: this.container,
      scaleY: 1.25, scaleX: this.container.scaleX * 1.1,
      duration: 80, yoyo: true, ease: 'Bounce.Out',
    });
  }

  // ─── Snap (for remote players / init) ────────────────────────────────────────

  snapTo(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.container.x = tileX * TILE_SIZE + TILE_SIZE / 2;
    this.container.y = tileY * TILE_SIZE + TILE_SIZE / 2;
  }

  destroy() {
    this.container.destroy();
  }
}
