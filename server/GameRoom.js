class GameRoom {
  constructor(code) {
    this.code      = code;
    this.players   = [];    // [{ id, socketId, tileX, tileY, transform }]
    this.levelId   = 1;
    this.started   = false;
    // Mutable game state
    this.activatedPlates = new Set();
    this.openDoors       = new Set();
    this.extinguished    = new Set(); // fire tiles turned to floor
  }

  addPlayer(socketId) {
    if (this.players.length >= 2) return false;
    this.players.push({ id: socketId, socketId, tileX: 1, tileY: 1, transform: 'normal' });
    return true;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
  }

  getPlayer(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  isFull()  { return this.players.length >= 2; }
  isEmpty() { return this.players.length === 0; }

  updatePlayerPos(socketId, tileX, tileY, transform) {
    const p = this.getPlayer(socketId);
    if (p) { p.tileX = tileX; p.tileY = tileY; p.transform = transform; }
  }

  activatePlate(row, col) {
    const key = `${row},${col}`;
    if (this.activatedPlates.has(key)) return false;
    this.activatedPlates.add(key);
    return true;
  }

  openDoor(row, col) {
    this.openDoors.add(`${row},${col}`);
  }

  extinguishFire(tileX, tileY) {
    this.extinguished.add(`${tileY},${tileX}`);
  }

  serialize() {
    return {
      code:      this.code,
      players:   this.players.map(p => ({ id: p.id, tileX: p.tileX, tileY: p.tileY, transform: p.transform })),
      levelId:   this.levelId,
      started:   this.started,
      activatedPlates: [...this.activatedPlates],
      openDoors:       [...this.openDoors],
      extinguished:    [...this.extinguished],
    };
  }
}

module.exports = { GameRoom };
