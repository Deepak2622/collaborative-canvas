const DrawingState = require('./drawing-state');

class Room {
  constructor(name) {
    this.name = name;
    this.users = {};
    this.state = new DrawingState();
  }
  addUser(id) {
    const color = this.randomColor();
    this.users[id] = { id, color };
    return this.users[id];
  }
  removeUser(id) {
    delete this.users[id];
  }
  randomColor() {
    const palette = ['#e6194B','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe'];
    return palette[Math.floor(Math.random()*palette.length)];
  }
}

class RoomManager {
  constructor() {
    this.rooms = {};
  }
  getRoom(name) {
    if (!this.rooms[name]) this.rooms[name] = new Room(name);
    return this.rooms[name];
  }
}

module.exports = RoomManager;
