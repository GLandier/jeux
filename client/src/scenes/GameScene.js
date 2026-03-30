import Phaser from 'phaser';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, GAME_WIDTH, GAME_HEIGHT, TILE, COLORS, TRANSFORM_INFO } from '../constants.js';
import { getLevel } from '../levels/LevelData.js';
import { Player } from '../entities/Player.js';

const DIR = { LEFT: [-1,0], RIGHT: [1,0], UP: [0,-1], DOWN: [0,1] };

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  // ─── Init ────────────────────────────────────────────────────────────────────

  init(data) {
    this.levelId     = data.levelId     ?? 1;
    this.multiplayer = data.multiplayer ?? false;
    this.roomCode    = data.roomCode    ?? null;
    this.playerId    = data.playerId    ?? null;
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  create() {
    this.levelData = getLevel(this.levelId);
    if (!this.levelData) { this.scene.start('LevelSelectScene'); return; }

    this._buildTileLayer();
    this._spawnPlayer();
    this._setupInput();
    this._setupEvents();

    // Launch the UI overlay (runs in parallel)
    this.scene.launch('UIScene', {
      levelId:          this.levelId,
      levelName:        this.levelData.name,
      unlockedTransforms: this.levelData.unlockedTransforms,
      hint:             this.levelData.hint,
    });

    // Show level intro hint
    this._showHint(this.levelData.hint, 3000);

    // Multiplayer: connect to server
    if (this.multiplayer && this.roomCode) {
      this._setupNetwork();
    }
  }

  // ─── Tile Layer ──────────────────────────────────────────────────────────────

  _buildTileLayer() {
    this.tileGfx = this.add.graphics().setDepth(0);
    this._drawAllTiles();

    // Listen for tile changes (fire extinguished, doors opened)
    this.events.on('tileChanged', (tx, ty) => this._redrawTile(tx, ty));
  }

  _drawAllTiles() {
    const g = this.tileGfx;
    g.clear();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        this._drawTileAt(g, col, row, this.levelData.grid[row][col]);
      }
    }
  }

  _drawTileAt(g, col, row, tileId) {
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;
    const s = TILE_SIZE;

    // Check if this is an open door
    const isOpenDoor = tileId === TILE.DOOR && this.levelData.openDoors.has(`${row},${col}`);

    switch (tileId) {
      case TILE.FLOOR:
      case TILE.SPAWN: {
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(x, y, s, s);
        g.lineStyle(1, COLORS.FLOOR_LINE, 0.4);
        g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
        if (tileId === TILE.SPAWN) {
          g.fillStyle(COLORS.SPAWN_MARK, 0.25);
          g.fillCircle(x + s/2, y + s/2, 12);
        }
        break;
      }
      case TILE.WALL: {
        g.fillStyle(COLORS.WALL);
        g.fillRect(x, y, s, s);
        g.fillStyle(COLORS.WALL_FACE);
        g.fillRect(x + 3, y + 3, s - 6, s - 6);
        // Inner detail lines
        g.lineStyle(1, COLORS.WALL, 0.5);
        g.strokeRect(x + 6, y + 6, s - 12, s - 12);
        break;
      }
      case TILE.ARCH: {
        // Floor with gold border indicating narrow passage
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(x, y, s, s);
        g.fillStyle(COLORS.ARCH_BG, 0.4);
        g.fillRect(x, y, s, s);
        g.lineStyle(3, COLORS.ARCH, 1);
        g.strokeRect(x + 1, y + 1, s - 2, s - 2);
        // Small arrows showing it's a squeeze
        g.fillStyle(COLORS.ARCH, 1);
        g.fillTriangle(x + 4, y + s/2, x + 12, y + s/2 - 6, x + 12, y + s/2 + 6);
        g.fillTriangle(x + s - 4, y + s/2, x + s - 12, y + s/2 - 6, x + s - 12, y + s/2 + 6);
        break;
      }
      case TILE.EXIT: {
        g.fillStyle(COLORS.EXIT_GLOW, 0.5);
        g.fillRect(x, y, s, s);
        g.fillStyle(COLORS.EXIT, 1);
        g.fillRect(x + 6, y + 6, s - 12, s - 12);
        g.lineStyle(2, 0xFFFFFF, 0.8);
        // Star / portal
        const cx = x + s/2, cy = y + s/2, r = 12;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.beginPath();
          g.moveTo(cx, cy);
          g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          g.strokePath();
        }
        break;
      }
      case TILE.WIND_R:
      case TILE.WIND_L:
      case TILE.WIND_U:
      case TILE.WIND_D: {
        g.fillStyle(COLORS.WIND_BG, 0.7);
        g.fillRect(x, y, s, s);
        g.lineStyle(1, COLORS.FLOOR_LINE, 0.3);
        g.strokeRect(x, y, s, s);
        // Arrow
        g.fillStyle(COLORS.WIND_ARROW, 0.8);
        const mx = x + s/2, my = y + s/2;
        const ar = 10;
        if (tileId === TILE.WIND_R) g.fillTriangle(mx - ar, my - 7, mx - ar, my + 7, mx + ar, my);
        if (tileId === TILE.WIND_L) g.fillTriangle(mx + ar, my - 7, mx + ar, my + 7, mx - ar, my);
        if (tileId === TILE.WIND_U) g.fillTriangle(mx - 7, my + ar, mx + 7, my + ar, mx, my - ar);
        if (tileId === TILE.WIND_D) g.fillTriangle(mx - 7, my - ar, mx + 7, my - ar, mx, my + ar);
        break;
      }
      case TILE.PLATE: {
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(x, y, s, s);
        const activated = this.levelData.activatedPlates.has(`${row},${col}`);
        g.fillStyle(activated ? COLORS.PLATE_ACT : COLORS.PLATE, 1);
        g.fillRoundedRect(x + 6, y + 6, s - 12, s - 12, 4);
        g.lineStyle(2, 0xFFFFFF, 0.3);
        g.strokeRoundedRect(x + 6, y + 6, s - 12, s - 12, 4);
        break;
      }
      case TILE.DOOR: {
        if (isOpenDoor) {
          // Open door = floor with outline
          g.fillStyle(COLORS.FLOOR);
          g.fillRect(x, y, s, s);
          g.lineStyle(2, COLORS.DOOR_OPEN, 0.6);
          g.strokeRect(x + 2, y + 2, s - 4, s - 4);
        } else {
          g.fillStyle(COLORS.DOOR);
          g.fillRect(x, y, s, s);
          g.fillStyle(0x6B1C1C);
          g.fillRect(x + 4, y + 4, s - 8, s - 8);
          // Lock symbol
          g.fillStyle(0xFFCC00);
          g.fillCircle(x + s/2, y + s/2 - 2, 6);
          g.fillRect(x + s/2 - 4, y + s/2 + 2, 8, 8);
        }
        break;
      }
      case TILE.FIRE: {
        g.fillStyle(0x1A0A00);
        g.fillRect(x, y, s, s);
        // Flame layers
        g.fillStyle(COLORS.FIRE, 0.9);
        g.fillTriangle(x + s/2, y + 4, x + 8, y + s - 4, x + s - 8, y + s - 4);
        g.fillStyle(COLORS.FIRE2, 0.8);
        g.fillTriangle(x + s/2, y + 14, x + 14, y + s - 6, x + s - 14, y + s - 6);
        g.fillStyle(0xFFFF88, 0.6);
        g.fillTriangle(x + s/2, y + 22, x + 20, y + s - 8, x + s - 20, y + s - 8);
        break;
      }
      case TILE.WATER_CH: {
        g.fillStyle(COLORS.WATER_CH);
        g.fillRect(x, y, s, s);
        // Wave lines
        g.lineStyle(2, COLORS.WATER_CH2, 0.7);
        for (let w = 0; w < 3; w++) {
          const wy = y + 10 + w * 14;
          g.beginPath();
          g.moveTo(x + 2, wy);
          for (let px = 2; px < s; px += 8) {
            g.lineTo(x + px + 4, wy - 4);
            g.lineTo(x + px + 8, wy);
          }
          g.strokePath();
        }
        break;
      }
      default: {
        // Unknown tile – render as floor
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(x, y, s, s);
      }
    }
  }

  _redrawTile(tx, ty) {
    // Redraw a single tile region
    const g = this.tileGfx;
    const x = tx * TILE_SIZE, y = ty * TILE_SIZE;
    // Clear region via clip (Phaser Graphics doesn't support partial clear easily,
    // so we just redraw the whole layer for simplicity)
    this._drawAllTiles();
  }

  // ─── Player Spawn ────────────────────────────────────────────────────────────

  _spawnPlayer() {
    let spawnX = 1, spawnY = 1;
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (this.levelData.grid[r][c] === TILE.SPAWN) { spawnX = c; spawnY = r; }
      }
    }
    this.player = new Player(this, spawnX, spawnY, 'normal');
    this.transformIndex = 0;

    // Emit initial state to UI
    this.events.emit('transformChanged', 'normal', this.levelData.unlockedTransforms);
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  _setupInput() {
    const kb = this.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.wasd    = kb.addKeys('W,A,S,D');
    this.keyQ    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyE    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyR    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyESC  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Numeric keys 1-5 for quick transform
    this.numKeys = [];
    for (let i = 1; i <= 5; i++) {
      this.numKeys.push(kb.addKey(Phaser.Input.Keyboard.KeyCodes['ONE' + (i === 1 ? '' : i)]));
    }
    this.numKeys = [
      kb.addKey(49), kb.addKey(50), kb.addKey(51), kb.addKey(52), kb.addKey(53),
    ];

    this.moveTimer = 0;
  }

  update(time, delta) {
    if (!this.player || this._won) return;

    this.moveTimer = Math.max(0, this.moveTimer - delta);

    const { LEFT, RIGHT, UP, DOWN } = DIR;
    const { left, right, up, down } = this.cursors;
    const { A, D, W, S } = this.wasd;

    const JD = Phaser.Input.Keyboard.JustDown;

    // Movement (first press instant, hold repeats after 200ms every 120ms)
    const tryDir = (dx, dy) => {
      if (this.moveTimer > 0) return;
      const moved = this.player.tryMove(dx, dy, this.levelData, (nx, ny) => {
        this._syncMove(nx, ny);
      });
      if (moved) this.moveTimer = 120;
    };

    if (left.isDown  || A.isDown)  tryDir(...LEFT);
    else if (right.isDown || D.isDown) tryDir(...RIGHT);
    else if (up.isDown   || W.isDown)  tryDir(...UP);
    else if (down.isDown  || S.isDown)  tryDir(...DOWN);
    else this.moveTimer = 0;

    // Transform: Q = next, E = prev
    if (JD(this.keyQ)) this._cycleTransform(1);
    if (JD(this.keyE)) this._cycleTransform(-1);

    // Numeric shortcuts
    this.numKeys.forEach((k, i) => {
      if (JD(k)) this._selectTransformByIndex(i);
    });

    // Restart level
    if (JD(this.keyR)) this._restartLevel();

    // Back to menu
    if (JD(this.keyESC)) {
      this.scene.stop('UIScene');
      this.scene.start('LevelSelectScene', { multiplayer: this.multiplayer });
    }
  }

  // ─── Events ──────────────────────────────────────────────────────────────────

  _setupEvents() {
    this.events.on('plateActivated', (tx, ty, player) => {
      const key = `${ty},${tx}`;
      if (this.levelData.activatedPlates.has(key)) return;
      this.levelData.activatedPlates.add(key);

      // Open linked doors
      const link = this.levelData.links.find(l => l.plate[0] === ty && l.plate[1] === tx);
      if (link) {
        link.doors.forEach(([dr, dc]) => {
          this.levelData.openDoors.add(`${dr},${dc}`);
        });
        this._drawAllTiles();
        this._flashMessage('Porte ouverte !');
      }
    });

    this.events.on('playerReachedExit', (player) => {
      if (this._won) return;
      if (player === this.player) this._winLevel();
    });

    this.events.on('tileChanged', () => this._drawAllTiles());
  }

  // ─── Transformation ──────────────────────────────────────────────────────────

  _cycleTransform(dir) {
    const available = this.levelData.unlockedTransforms;
    this.transformIndex = (this.transformIndex + dir + available.length) % available.length;
    const t = available[this.transformIndex];
    this.player.setTransform(t);
    this.events.emit('transformChanged', t, available);
    this._syncTransform(t);
  }

  _selectTransformByIndex(i) {
    const available = this.levelData.unlockedTransforms;
    if (i >= available.length) return;
    this.transformIndex = i;
    const t = available[i];
    this.player.setTransform(t);
    this.events.emit('transformChanged', t, available);
    this._syncTransform(t);
  }

  // ─── Win / Restart ───────────────────────────────────────────────────────────

  _winLevel() {
    this._won = true;

    // Unlock next level
    const unlocked = this.registry.get('unlockedLevels') || [1];
    const next = this.levelId + 1;
    if (!unlocked.includes(next)) {
      unlocked.push(next);
      this.registry.set('unlockedLevels', unlocked);
    }

    // Win animation
    this.cameras.main.flash(500, 255, 255, 100);
    this._flashMessage('🎉 Niveau complété !', 2500);

    this.time.delayedCall(2800, () => {
      this.scene.stop('UIScene');
      if (next <= 3) {
        this.scene.start('GameScene', { levelId: next, multiplayer: this.multiplayer });
      } else {
        this.scene.start('LevelSelectScene');
      }
    });
  }

  _restartLevel() {
    this.scene.stop('UIScene');
    this.scene.restart({ levelId: this.levelId, multiplayer: this.multiplayer, roomCode: this.roomCode });
  }

  // ─── UI Helpers ──────────────────────────────────────────────────────────────

  _showHint(text, duration = 2500) {
    const W = GAME_WIDTH;
    const msg = this.add.text(W / 2, GAME_HEIGHT / 2 - 40, text, {
      fontSize: '20px', fontFamily: 'Arial', color: '#FFFFFF',
      backgroundColor: '#00000099', padding: { x: 16, y: 10 },
      wordWrap: { width: W - 80 }, align: 'center',
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: msg, alpha: 1, duration: 400, ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(duration, () => {
          this.tweens.add({ targets: msg, alpha: 0, duration: 400, onComplete: () => msg.destroy() });
        });
      },
    });
  }

  _flashMessage(text, duration = 1500) {
    const W = GAME_WIDTH;
    const msg = this.add.text(W / 2, 80, text, {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#FFD700',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: msg, alpha: 1, y: 70, duration: 300,
      onComplete: () => {
        this.time.delayedCall(duration - 600, () => {
          this.tweens.add({ targets: msg, alpha: 0, duration: 300, onComplete: () => msg.destroy() });
        });
      },
    });
  }

  // ─── Multiplayer (stubs – filled by NetworkSystem) ───────────────────────────

  _setupNetwork() {
    import('../systems/NetworkSystem.js').then(({ NetworkSystem }) => {
      this.network = new NetworkSystem(this, this.roomCode, this.playerId);
    });
  }

  _syncMove(nx, ny) {
    this.network?.sendMove(nx, ny);
  }

  _syncTransform(t) {
    this.network?.sendTransform(t);
  }

  // Called by NetworkSystem when remote player moves
  onRemoteMove(playerId, tileX, tileY, transform) {
    if (!this.remotePlayer) {
      this.remotePlayer = new Player(this, tileX, tileY, transform, true);
    } else {
      this.remotePlayer.snapTo(tileX, tileY);
      this.remotePlayer.setTransform(transform);
    }
  }
}
