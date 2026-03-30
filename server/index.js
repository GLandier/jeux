const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const cors      = require('cors');
const { GameRoom } = require('./GameRoom');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// ── Room registry ─────────────────────────────────────────────────────────────
const rooms = new Map(); // code → GameRoom

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); }
  while (rooms.has(code));
  return code;
}

// ── Socket events ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // ── Create room ──
  socket.on('create_room', () => {
    const code = makeCode();
    const room = new GameRoom(code);
    room.addPlayer(socket.id);
    rooms.set(code, room);
    socket.join(code);
    socket.emit('room_created', { roomCode: code });
    console.log(`Room created: ${code} by ${socket.id}`);
  });

  // ── Join room ──
  socket.on('join_room', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', { message: `Salle "${roomCode}" introuvable.` });
      return;
    }
    if (room.isFull()) {
      socket.emit('error', { message: 'Salle déjà pleine.' });
      return;
    }
    room.addPlayer(socket.id);
    socket.join(roomCode);
    socket.emit('room_joined', { roomCode, players: room.players });
    io.to(roomCode).emit('player_joined', { players: room.players });
    console.log(`Player ${socket.id} joined room ${roomCode}`);
  });

  // ── Rejoin (reconnect during game) ──
  socket.on('rejoin_room', ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    socket.join(roomCode);
    // Re-register with possibly new socket id but same player
    const existing = room.getPlayer(playerId);
    if (existing) existing.socketId = socket.id;
    socket.emit('game_state', room.serialize());
  });

  // ── Start game ──
  socket.on('start_game', ({ levelId }) => {
    const roomCode = [...socket.rooms].find(r => r !== socket.id);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    room.levelId = levelId ?? 1;
    room.started = true;
    io.to(roomCode).emit('game_start', { levelId: room.levelId });
    console.log(`Room ${roomCode} started level ${room.levelId}`);
  });

  // ── Player moves ──
  socket.on('player_move', ({ roomCode, tileX, tileY, transform }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.updatePlayerPos(socket.id, tileX, tileY, transform);
    socket.to(roomCode).emit('remote_move', {
      playerId: socket.id, tileX, tileY, transform,
    });
  });

  // ── Player transforms ──
  socket.on('player_transform', ({ roomCode, transform }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const p = room.getPlayer(socket.id);
    if (p) p.transform = transform;
    socket.to(roomCode).emit('remote_move', {
      playerId: socket.id, tileX: p?.tileX, tileY: p?.tileY, transform,
    });
  });

  // ── Plate activated (broadcast to sync) ──
  socket.on('plate_activated', ({ roomCode, row, col }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const isNew = room.activatePlate(row, col);
    if (isNew) {
      socket.to(roomCode).emit('plate_activated', { plateKey: `${row},${col}` });
    }
  });

  // ── Fire extinguished ──
  socket.on('fire_extinguished', ({ roomCode, tileX, tileY }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.extinguishFire(tileX, tileY);
    socket.to(roomCode).emit('tile_changed', { tileX, tileY, newTile: 0 });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    for (const [code, room] of rooms) {
      room.removePlayer(socket.id);
      if (room.isEmpty()) {
        rooms.delete(code);
        console.log(`Room ${code} deleted`);
      } else {
        io.to(code).emit('player_joined', { players: room.players });
      }
    }
  });
});

// ── HTTP health check ─────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', rooms: rooms.size }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 Serveur Morphia démarré sur http://localhost:${PORT}`);
  console.log('   Commandes client: cd client && npm run dev\n');
});
