import Phaser from 'phaser';
import { GAME_WIDTH, SCREEN_HEIGHT } from '../constants.js';
import { io } from 'socket.io-client';

export class MultiLobbyScene extends Phaser.Scene {
  constructor() { super('MultiLobbyScene'); }

  create() {
    this._socket   = null;
    this._roomCode = null;
    this._players  = [];

    const W = GAME_WIDTH, H = SCREEN_HEIGHT;

    // BG
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0A0A1A, 0x0A0A1A, 0x1A1A3E, 0x1A1A3E, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(W / 2, 60, 'MULTIJOUEUR', {
      fontSize: '40px', fontFamily: 'Arial Black', color: '#FFFFFF',
      stroke: '#44AA44', strokeThickness: 6,
    }).setOrigin(0.5);

    // Status text
    this.statusText = this.add.text(W / 2, H / 2, 'Connexion au serveur…', {
      fontSize: '20px', fontFamily: 'Arial', color: '#88AADD',
    }).setOrigin(0.5);

    // Connect
    this._connect();

    // Back
    const back = this.add.text(20, 20, '← Retour', {
      fontSize: '20px', fontFamily: 'Arial', color: '#88AADD',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#FFFFFF'));
    back.on('pointerout',  () => back.setColor('#88AADD'));
    back.on('pointerup',   () => { this._socket?.disconnect(); this.scene.start('MainMenuScene'); });
  }

  _connect() {
    try {
      this._socket = io('http://localhost:3000', { transports: ['websocket'] });

      this._socket.on('connect', () => {
        this.statusText.setText('Connecté ! Choisissez une option :');
        this._showOptions();
      });

      this._socket.on('connect_error', () => {
        this.statusText.setText('❌ Serveur non disponible.\nLancez le serveur avec:\ncd server && node index.js');
      });

      this._socket.on('room_created', ({ roomCode }) => {
        this._roomCode = roomCode;
        this._showWaiting(roomCode);
      });

      this._socket.on('room_joined', ({ roomCode, players }) => {
        this._roomCode = roomCode;
        this._players  = players;
        this._showWaiting(roomCode, players.length);
      });

      this._socket.on('player_joined', ({ players }) => {
        this._players = players;
        this._updatePlayerList(players);
        if (players.length === 2) {
          this._showStartButton();
        }
      });

      this._socket.on('game_start', ({ levelId }) => {
        this.scene.start('GameScene', {
          levelId:     levelId ?? 1,
          multiplayer: true,
          roomCode:    this._roomCode,
          playerId:    this._socket.id,
        });
      });

      this._socket.on('error', ({ message }) => {
        this.statusText.setText(`Erreur : ${message}`);
      });
    } catch (e) {
      this.statusText.setText('socket.io non disponible.\nMode multijoueur nécessite le serveur.');
    }
  }

  _showOptions() {
    const W = GAME_WIDTH, H = SCREEN_HEIGHT;
    this._clearOptions();

    this._optionGfx = [];

    // Create room button
    this._makeButton(W / 2, H / 2 - 60, 'Créer une partie', () => {
      this._socket.emit('create_room');
      this._clearOptions();
    }, 0x226622, 0x44AA44);

    // Join room
    const joinLabel = this.add.text(W / 2, H / 2 + 30, 'Code de la partie :', {
      fontSize: '18px', fontFamily: 'Arial', color: '#AACCFF',
    }).setOrigin(0.5);
    this._optionGfx.push(joinLabel);

    // Fake input field (Phaser HTML input)
    const inputEl = document.createElement('input');
    inputEl.type  = 'text';
    inputEl.maxLength = 4;
    inputEl.placeholder = 'XXXX';
    inputEl.style.cssText = [
      'position:absolute', 'width:140px', 'height:44px',
      'font-size:28px', 'text-align:center', 'letter-spacing:8px',
      'background:#1A2A3A', 'color:#FFFFFF', 'border:2px solid #4488FF',
      'border-radius:8px', 'outline:none', 'font-family:Arial Black',
    ].join(';');

    const canvas  = this.sys.game.canvas;
    const rect    = canvas.getBoundingClientRect();
    const scaleX  = rect.width  / canvas.width;
    const scaleY  = rect.height / canvas.height;
    inputEl.style.left = (rect.left + (W / 2 - 70)  * scaleX) + 'px';
    inputEl.style.top  = (rect.top  + (H / 2 + 58) * scaleY)  + 'px';
    document.body.appendChild(inputEl);
    this._inputEl = inputEl;

    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._joinRoom(inputEl.value.toUpperCase());
    });

    const joinBtn = this._makeButton(W / 2, H / 2 + 140, 'Rejoindre', () => {
      this._joinRoom(inputEl.value.toUpperCase());
    }, 0x224466, 0x4488FF);
  }

  _joinRoom(code) {
    if (code.length !== 4) return;
    if (this._inputEl) { document.body.removeChild(this._inputEl); this._inputEl = null; }
    this._clearOptions();
    this._socket.emit('join_room', { roomCode: code });
  }

  _showWaiting(code, playerCount = 1) {
    const W = GAME_WIDTH, H = SCREEN_HEIGHT;
    this._clearOptions();
    this._optionGfx = [];

    this.statusText.setText('');

    const g = this.add.graphics();
    g.fillStyle(0x1A2A3A);
    g.fillRoundedRect(W/2 - 160, H/2 - 70, 320, 60, 10);
    g.lineStyle(2, 0x4488FF);
    g.strokeRoundedRect(W/2 - 160, H/2 - 70, 320, 60, 10);
    this._optionGfx.push(g);

    this.add.text(W/2, H/2 - 40, `Code : ${code}`, {
      fontSize: '32px', fontFamily: 'Arial Black', color: '#FFD700',
    }).setOrigin(0.5).setName('codeText');
    this._optionGfx.push(this.children.getByName('codeText'));

    this._playerListText = this.add.text(W/2, H/2 + 10, `Joueurs : ${playerCount}/2`, {
      fontSize: '20px', color: '#88AADD', fontFamily: 'Arial',
    }).setOrigin(0.5);
    this._optionGfx.push(this._playerListText);

    this.add.text(W/2, H/2 + 50, 'En attente du second joueur…', {
      fontSize: '16px', color: '#556677', fontFamily: 'Arial',
    }).setOrigin(0.5);
  }

  _updatePlayerList(players) {
    if (this._playerListText) {
      this._playerListText.setText(`Joueurs : ${players.length}/2`);
    }
  }

  _showStartButton() {
    const W = GAME_WIDTH, H = SCREEN_HEIGHT;
    this._makeButton(W / 2, H / 2 + 120, '▶  LANCER LA PARTIE', () => {
      this._socket.emit('start_game', { levelId: 1 });
    }, 0x226622, 0x44EE44);
  }

  _clearOptions() {
    (this._optionGfx || []).forEach(o => { try { o.destroy(); } catch(_){} });
    this._optionGfx = [];
    if (this._inputEl) { try { document.body.removeChild(this._inputEl); } catch(_){} this._inputEl = null; }
  }

  _makeButton(x, y, label, callback, colorBg, colorHover) {
    const tw = 280, th = 52, r = 10;
    const btn = this.add.graphics();
    btn.x = x; btn.y = y;

    const draw = (c) => {
      btn.clear();
      btn.fillStyle(c).fillRoundedRect(-tw/2, -th/2, tw, th, r);
      btn.lineStyle(2, 0xFFFFFF, 0.2).strokeRoundedRect(-tw/2, -th/2, tw, th, r);
    };
    draw(colorBg);

    const txt = this.add.text(x, y, label, {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#FFFFFF',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, tw, th).setInteractive({ useHandCursor: true });
    zone.on('pointerover',  () => draw(colorHover));
    zone.on('pointerout',   () => draw(colorBg));
    zone.on('pointerup', callback);

    (this._optionGfx = this._optionGfx || []).push(btn, txt, zone);
    return zone;
  }

  shutdown() {
    if (this._inputEl) { try { document.body.removeChild(this._inputEl); } catch(_){} }
  }
}
