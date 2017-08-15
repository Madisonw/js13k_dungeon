const TILE_SIZE = 36,
      MAP_SIZE = 50,
      VIEWPORT = 20,
      VIEWPORT_SIZE = TILE_SIZE * VIEWPORT,
      _ = 1, //Tile Padding
      _BG = "bg", //Background Tile
      _O = "r", //Room Tile
      _H = "h", //Hallway Tile
      _R = "k", //Rock Tile
      _D = "d", //Door Tile
      _B = "b", //Open Door Tile
      _P = "p", //player tile
      C = {}; //color Dictionary
      C[_BG] = "black"; //Background Color
      C[_O] = "#777"; //Room Color
      C[_H] = C[_O]; //Hallway Color
      C[_R] = "black"; //Rock Color
      C[_D] = "#513520"; //Door Color
      C[_B] = "#c1ad9e"; //Open Door Color
      C[_P] = "orange"; //Door Color

class Room {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class Dungeon {
  constructor(canvas) {
    this.characters = []
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.map = new Array(MAP_SIZE);
    for (let y=0; y < MAP_SIZE; y++) {
      this.map[y] = new Array(MAP_SIZE);
      for (let x=0; x < MAP_SIZE; x++) {
        this.map[y][x] = _R;
      }
    }
    this.generate();
  }

  placeCharacter(c) {
    this.characters.push(c);
  }

  setPlayer(c) {
    this.player = c;
  }

  generateRooms(m) {
    const ATTEMPTS = 800;
    const MIN_WIDTH = 7;
    const MIN_HEIGHT = 7;
    const MAX_WIDTH = 11;
    const MAX_HEIGHT = 11;
    let rooms = [];

    const roomsCollide = (room1, room2) => {
      return (
         room1.x < room2.x + room2.width &&
         room1.x + room1.width > room2.x &&
         room1.y < room2.y + room2.height &&
         room1.height + room1.y > room2.y);
    }

    const isPlaceable = (attemptedRoom) => {
      let isPlaceable = true;
      rooms.forEach((room) => {
        if (isPlaceable == false) return;
        if (roomsCollide(room, attemptedRoom)) {
          isPlaceable = false;
        }
      });
      return isPlaceable;
    }

    for (let i=0; i < ATTEMPTS; i++) {
      const width = MIN_WIDTH + (Math.round(Math.random() * MAX_WIDTH));
      const height = MIN_HEIGHT + (Math.round(Math.random() * MAX_HEIGHT));
      const x = Math.round(Math.random() * (MAP_SIZE - width - 1));
      const y =  Math.round(Math.random() * (MAP_SIZE - height - 1));
      const room = new Room(x, y, width, height);
      if (isPlaceable(room)) {
        rooms.push(room);
      }
    }

    return rooms.map((room) => {
      room.x = room.x + _;
      room.width = room.width - _;
      room.y = room.y + _;
      room.height = room.height - _;
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          m[y][x] = _O;
        }
      }
      return room;
    });
  }

  generateMaze() {
    const m = this.map;
    const _ = 1;
    const dir = ["n","s","e","w"];
    const randomDir = () => {
      return dir[Math.round(Math.random() * dir.length)];
    }

    const floodFill = (x, y, targetC, replacementC, direction) => {
        const node = m[y][x];

        //If the C of node is not equal to target-C, return.

        if (node != targetC) {
          return false;
        }

        //If the C of node is not equal to target-C, return.
        if (node != _R) {
          return false;
        }
        let isValid = true;
        switch (direction) {
          case "s": if (
            (!m[y + _]) ||
            (m[y + _][x] != _R) || //s
            (m[y][x - _] != _R) || //w
            (m[y][x + _] != _R) //e
          ) {isValid = false; } break;
          case "n": if (
            (!m[y - _]) ||
            (m[y - _][x] != _R) || //n
            (m[y][x - _] != _R) || //w
            (m[y][x + _] != _R) //e
          ) {isValid = false; } break;
          case "w": if (
            (!m[y][x - _]) ||
            (m[y][x - _] != _R) || //w
            (!m[y + _] || m[y + _][x] != _R) || //s
            (!m[y - _] || m[y - _][x] != _R) //n
          ) {isValid = false; } break;
          case "e": if (
            (!m[y][x + _]) ||
            (m[y][x + _] != _R) || //e
            (!m[y + _] || m[y + _][x] != _R) || //s
            (!m[y - _] || m[y - _][x] != _R) //n
          ) {isValid = false; } break;
        }
        if (!isValid) return false;
        //Set the C of node to replacement-C.
        m[y][x] = replacementC;


        let success = false;
        let attempts = 0;
        while(success == false && attempts < 5) {
          const newDir = randomDir();
          switch(newDir) {
            case "s":
              //Perform Flood-fill (one step to the south of node, target-C, replacement-C).
              if (m[y+_]) success = floodFill(x, y+_, m[y+_][x], replacementC, "s");
              if (m[y][x+_]) success = floodFill(x+_, y,  m[y][x+_], replacementC, "e");
              if (m[y][x-_]) success = floodFill(x-_, y,  m[y][x-_], replacementC, "w");
              break;
            case "n":
              //Perform Flood-fill (one step to the north of node, target-C, replacement-C).
              if (m[y-_]) success = floodFill(x, y-_,  m[y-_][x], replacementC, "n");
              if (m[y][x-_]) success = floodFill(x-_, y,  m[y][x-_], replacementC, "w");
              if (m[y][x+_]) success = floodFill(x+_, y,  m[y][x+_], replacementC, "e");
              break;
            case "w":
              //Perform Flood-fill (one step to the west of node, target-C, replacement-C).
              if (m[y][x-_]) success = floodFill(x-_, y,  m[y][x-_], replacementC, "w");
              if (m[y-_]) success = floodFill(x, y-_,  m[y-_][x], replacementC, "n");
              if (m[y+_]) success = floodFill(x, y+_, m[y+_][x], replacementC, "s");
              break;
            case "e":
              //Perform Flood-fill (one step to the east of node, target-C, replacement-C).
              if (m[y][x+_]) success = floodFill(x+_, y,  m[y][x+_], replacementC, "e");
              if (m[y-_]) success = floodFill(x, y-_,  m[y-_][x], replacementC, "n");
              if (m[y+_]) success = floodFill(x, y+_, m[y+_][x], replacementC, "s");
              break;
        }
        attempts++;

      }

      return true;
    }

    for (let y=0; y < MAP_SIZE; y++) {
      for (let x=0; x < MAP_SIZE; x++) {
        if (
          m[y][x] == _R &&
          m[y-_] &&
          m[y+_] &&
          m[y][x-_] &&
          m[y][x+_] &&
          m[y-_][x] == _R &&
          m[y+_][x] == _R &&
          m[y][x-_] == _R &&
          m[y][x+_] == _R
        ) {
          floodFill(x, y, _R, _H, randomDir());
        }
      }
    }
    return m;
  }

  connectRooms(rooms) {
    const m = this.map;
    const isNextTo = (x, y, nextToTile) => {
      if (m[y-1] && m[y-1][x] == nextToTile) return true;
      if (m[y+1] && m[y+1][x] == nextToTile) return true;
      if (m[y][x-1] == nextToTile) return true;
      if (m[y][x+1] == nextToTile) return true;
      return false;
    }

    rooms.forEach((room) => {
      const possibleConnectors = [];
      for (let y= room.y-1; y < room.y + room.height + 1; y++) {
        for (let x=room.x-1; x < room.x + room.width + 1; x++) {
          if (m[y][x] == _R && isNextTo(x, y, _O) && isNextTo(x, y, _H)) {
            possibleConnectors.push({x: x, y: y});
          }
        }
      }
      //const totalConnectors = Math.ceil(Math.random() * 5)
      const totalConnectors = 4;
      for (let c = 0; c < totalConnectors; c++) {
        const index = Math.round(Math.random() * (possibleConnectors.length - 1));
        const coord = possibleConnectors[index];
        m[coord.y][coord.x] = _D;
      }
    })

  }

  removeDeadEnds() {
    const m = this.map;
    let done = false;
    while (!done) {
      done = true;
      for (let y=0; y < MAP_SIZE; y++) {
        for (let x=0; x < MAP_SIZE; x++) {
          if (m[y][x] == _H || m[y][x] == _D) {
            let exits = 0;
            if (m[y-1] && m[y-1][x] != _R) exits++;
            if (m[y+1] && m[y+1][x] != _R) exits++;
            if (m[y][x-1] != _R) exits++;
            if (m[y][x+1] != _R) exits++;

            if (exits < 2) {
              m[y][x] = _R;
              done = false;
            }
          }
        }
      }
    }
  }

  generate() {
    this.rooms = this.generateRooms(this.map);
    this.generateMaze();
    this.connectRooms(this.rooms);
    this.removeDeadEnds();
    this.startingRoom = this.rooms[Math.round(Math.random() * (this.rooms.length - 1))]
  }

  toggleDoor(x, y) {
    if (this.map[y][x] == _D) {
      this.map[y][x] = _B;
    } else if (this.map[y][x] == _B) {
      this.map[y][x] = _D;
    }
  }

  render() {
    this.renderMap();
    this.renderCharacters();
    this.renderPlayerLightRadius();
  }

  renderMap() {
    const map = this.map;
    const p = this.player;
    this.ctx.fillStyle = C[_BG];
    this.ctx.fillRect(1, 1, MAP_SIZE * TILE_SIZE, MAP_SIZE * TILE_SIZE);
    for (let y = this.vpStart("y"); y < this.vpStart("y") + VIEWPORT - _; y++) {
      for (let x = this.vpStart("x"); x < this.vpStart("x") + VIEWPORT - _; x++) {
        if (map[y] && map[y][x]) {
          this.ctx.fillStyle = C[map[y][x]];
          this.ctx.fillRect(
            this.vpAdjust(x, "x") * TILE_SIZE,
            this.vpAdjust(y, "y") * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE);
        }

      }
    }
  }

  renderCharacters() {
    const p = this.player;
    this.characters.forEach((c) => {
      this.ctx.fillStyle = C[c.TILE];
      this.ctx.fillRect(
        this.vpAdjust(c.loc.x, "x") * TILE_SIZE,
        this.vpAdjust(c.loc.y, "y") * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE);
    })
  }

  vpAdjust(val, axis) {
    return val - this.vpStart(axis);
  }

  vpStart(axis) {
    let result = this.player.loc[axis] - (VIEWPORT / 2) + _;
    if (result < 0) result = 0;
    return result;
  }

  renderPlayerLightRadius() {
    if (!this.player) return false;
    const p = this.player;
    const loc = p.loc;
    const x = this.vpAdjust(loc.x, "x") * TILE_SIZE + TILE_SIZE / 2;
    const y = this.vpAdjust(loc.y, "y") * TILE_SIZE + TILE_SIZE / 2;

    const gradient = this.ctx.createRadialGradient(x, y, TILE_SIZE * 8.5, x, y, 0);
    gradient.addColorStop(0,"black");
    gradient.addColorStop(1,"rgba(0,0,0,0)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - VIEWPORT_SIZE / 2, y - VIEWPORT_SIZE / 2, VIEWPORT_SIZE * 2, VIEWPORT_SIZE * 2);
  }
}

class Game {

  constructor(level, player) {
    this.FPS = 60;
    this.keyDown = this.keyDown.bind(this);
    this.level = level;
    this.player = player;
    this.bindKeys();
    this.placePlayer();
    this.level.setPlayer(player);
    this.gameLoop();
  }

  gameLoop() {
    const frame = 1000 / 60;
    this.level.render();
    setTimeout(() => {this.gameLoop()},frame);
  }

  bindKeys() {
    document.addEventListener("keydown",this.keyDown)
  }

  placePlayer() {
    const startingRoom = this.level.startingRoom;
    const x = startingRoom.x + Math.floor(startingRoom.width / 2);
    const y = startingRoom.y + Math.floor(startingRoom.height / 2);
    this.player.teleport(x, y);
    this.level.placeCharacter(this.player);
  }

  keyDown(event) {

    const mv = this.player.move;
    switch(event.key) {
      case "w": mv("n"); break;
      case "a": mv("w"); break;
      case "s": mv("s"); break;
      case "d": mv("e"); break;
      case "e": this.player.interact(); break;
    }
  }
}

class Character {
  constructor(dungeon) {
    this.TILE = "p"
    this.loc = {x:0, y:0}
    this.dungeon = dungeon;
    this.move = this.move.bind(this);
    this.interact = this.interact.bind(this);
  }

  interact() {
    const adjacent_tiles = [
      {x: this.loc.x, y: this.loc.y - 1}, //north
      {x: this.loc.x - 1, y: this.loc.y}, //west
      {x: this.loc.x, y: this.loc.y + 1}, //south
      {x: this.loc.x + 1, y: this.loc.y} //east
    ];
    let action_done = false;
    adjacent_tiles.forEach((loc) => {
      if (action_done) return;
      const t_loc = this.dungeon.map[loc.y][loc.x];
      if (t_loc == _D || t_loc == _B) {
        this.dungeon.toggleDoor(loc.x, loc.y);
      }
    })
  }

  move(dir) {
    const newLoc = {x: this.loc.x, y: this.loc.y};
    switch (dir) {
      case "n": newLoc.y = this.loc.y - 1 ; break;
      case "w": newLoc.x = this.loc.x - 1 ; break;
      case "s": newLoc.y = this.loc.y + 1 ; break;
      case "e": newLoc.x = this.loc.x + 1 ; break;
    }
    if (this.isValidLoc(newLoc)) {
      this.loc = newLoc;
    }
  }

  isValidLoc(loc) {
    if (!this.dungeon.map[loc.y] || !this.dungeon.map[loc.y][loc.x]) return false;
    const d_tile = this.dungeon.map[loc.y][loc.x];
    return (d_tile == _O || d_tile == _H || d_tile == _B); //room, hallway, or open door tile.
  }

  teleport(x, y) {
    this.loc = {x: x, y: y};
  }
}

class Player extends Character {
  constructor(dungeon) {
    super();
    this.dungeon = dungeon;
  }
}



const canvas = document.getElementById("game");
const d = new Dungeon(canvas);
const g = new Game(d, new Player(d));
