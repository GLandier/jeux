import { io } from 'socket.io-client';

export class NetworkSystem {
  constructor(scene, roomCode, playerId) {
    this.scene    = scene;
    this.roomCode = roomCode;
    this.playerId = playerId;

    this.socket = io('http://localhost:3000', { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.socket.emit('rejoin_room', { roomCode, playerId });
    });

    this.socket.on('remote_move', ({ playerId: pid, tileX, tileY, transform }) => {
      if (pid === this.playerId) return;
      scene.onRemoteMove(pid, tileX, tileY, transform);
    });

    this.socket.on('plate_activated', ({ plateKey }) => {
      // Server confirms plate activation from other player
      const [row, col] = plateKey.split(',').map(Number);
      scene.events.emit('plateActivated', col, row, null);
    });

    this.socket.on('tile_changed', ({ tileX, tileY, newTile }) => {
      scene.levelData.grid[tileY][tileX] = newTile;
      scene.events.emit('tileChanged', tileX, tileY);
    });

    this.socket.on('game_over', () => {
      scene.scene.stop('UIScene');
      scene.scene.start('LevelSelectScene');
    });
  }

  sendMove(tileX, tileY) {
    this.socket.emit('player_move', {
      roomCode: this.roomCode,
      tileX, tileY,
      transform: this.scene.player.transform,
    });
  }

  sendTransform(transform) {
    this.socket.emit('player_transform', {
      roomCode: this.roomCode,
      transform,
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
