const img = (uri) => {const i = new Image(); i.src = uri; return i; }
const IMG_FLOOR = img("img_prod/floor-min.png");
const IMG_WALL_N = img("img_prod/wall_n-min.png");
const rd = Math.random;
const fl = Math.floor;
const TS = 64,
      PLAYER_SIZE = TS / 2,
      MAP_SIZE = 50,
      VIEWPORT = 18,
      INFINITY = 1/0,
      VIEWPORT_SIZE = TS * VIEWPORT,
      DIR = ["s", "n", "e", "w"],
      _ = 1, //Tile Padding
      _BG = "bg", //Background Tile
      _O = "r", //Room Tile
      _H = "h", //Hallway Tile
      _R = "k", //Rock Tile
      _D = "d", //Door Tile
      _B = "b", //Open Door Tile
      _P = "p", //player tile
      _R_N = "r_n",
      E_S = "e_s", //skeleton Tile
      C = {}, //color Dictionary
      IMG = {} //img Dictionary
      C[E_S] = "#ceceb5"; //skeleton color
      C[_BG] = "black"; //Background Color
      C[_O] = "#777"; //Room Color
      C[_H] = C[_O]; //Hallway Color
      C[_R] = "#141111"; //Rock Color
      C[_R_N] = C[_R]; //Rock Color
      C[_D] = "#513520"; //Door Color
      C[_B] = "#c1ad9e"; //Open Door Color
      C[_P] = "orange"; //Door Color
      IMG[_O] = IMG_FLOOR
      IMG[_H] = IMG_FLOOR
      IMG[_R_N] = IMG_WALL_N
      IMG[_D] = IMG_FLOOR
      IMG[_B] = IMG_FLOOR

class PriorityQueue {
  constructor() {
    this._nodes = [];
  }

  enqueue(priority, key) {
    this._nodes.push({key: key, priority: priority });
    this.sort();
  }
  dequeue() {
    return this._nodes.shift().key;
  }
  sort() {
    this._nodes.sort(function (a, b) {
      return a.priority - b.priority;
    });
  }
  isEmpty() {
    return !this._nodes.length;
  }
}

class Graph {

  constructor() {
    this.vertices = {};
  }

  addVertex(name, edges){
    this.vertices[name] = edges;
  }

  shortestPath(start, finish) {
    let nodes = new PriorityQueue(),
        distances = {},
        previous = {},
        path = [],
        smallest, vertex, neighbor, alt;

    for(vertex in this.vertices) {
      if(vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(0, vertex);
      }
      else {
        distances[vertex] = INFINITY;
        nodes.enqueue(INFINITY, vertex);
      }

      previous[vertex] = null;
    }

    while(!nodes.isEmpty()) {
      smallest = nodes.dequeue();

      if(smallest === finish) {
        path = [];

        while(previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }

        break;
      }

      if(!smallest || distances[smallest] === INFINITY){
        continue;
      }

      for(neighbor in this.vertices[smallest]) {
        alt = distances[smallest] + this.vertices[smallest][neighbor];

        if(alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = smallest;

          nodes.enqueue(alt, neighbor);
        }
      }
    }

    return path;
  };
}

class Sprite {
  constructor(src, w, h, r_w, r_h) {
    this.img = new Image();
    this.img.src = src;
    this.w = w;
    this.h = h;
    this.r_w = r_w || w;
    this.r_h = r_h || h;
    this.getDrawArgsForIndex = this.getDrawArgsForIndex.bind(this);
  }

  getDrawArgsForIndex(frame_index, dest_x, dest_y) {
    return [
      this.img,
      frame_index * this.w, //frame index times frame width
      0,
      this.w,
      this.h,
      dest_x,
      dest_y,
      this.r_w,
      this.r_h
      ]
  }
}

class Item {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Oil extends Item {
  constructor(x, y) {
    super(x, y);
    this.img = img("img_prod/oil-min.png");
  }
}

class Picture extends Item {
  constructor(x, y) {
    super(x, y);
    this.img = img("img_prod/picture-min.png");
  }
}

class Room {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  randomLocationInRoom() {
    return {
      x: this.x + fl(rd() * this.width),
      y: this.y + fl(rd() * this.height)
    };
  }
}

class Dungeon {
  constructor(canvas) {
    this.characters = []
    this.items = []
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.map = new Array(MAP_SIZE);
    this.s_door_ns = new Sprite("img_prod/s_doors_ns-min.png", TS, TS);
    this.s_door_ew = new Sprite("img_prod/s_doors_ew-min.png", TS, TS);
    for (let y=0; y < MAP_SIZE; y++) {
      this.map[y] = new Array(MAP_SIZE);
      for (let x=0; x < MAP_SIZE; x++) {
        this.map[y][x] = _R;
      }
    }
    this.generate();
  }

  placeCharacter(c) {
    this.characters.unshift(c);
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
      const width = MIN_WIDTH + (Math.round(rd() * MAX_WIDTH));
      const height = MIN_HEIGHT + (Math.round(rd() * MAX_HEIGHT));
      const x = Math.round(rd() * (MAP_SIZE - width - 1));
      const y =  Math.round(rd() * (MAP_SIZE - height - 1));
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
          if (y === room.y) {
            m[y - 1][x] = _R_N;
          }
        }
      }

      return room;
    });
  }

  generateMaze() {
    const m = this.map;
    const _ = 1;
    const randomDir = () => {
      return DIR[Math.round(rd() * DIR.length)];
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
      //const totalConnectors = Math.ceil(rd() * 5)
      const totalConnectors = 4;
      for (let c = 0; c < totalConnectors; c++) {
        const index = Math.round(rd() * (possibleConnectors.length - 1));
        const coord = possibleConnectors[index];
        if (coord) {
          m[coord.y][coord.x] = _D;
          if (m[coord.y-1][coord.x] === _R) {
            m[coord.y-1][coord.x] = _R_N;
          }
        }
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
    for (let y=0; y < MAP_SIZE; y++) {
      for (let x=0; x < MAP_SIZE; x++) {
        if (
          m[y - 1] && m[y][x] === _H  && m[y - 1][x] === _R
        ) {
          m[y - 1][x] = _R_N;
        }
      }
    }
  }

  generateItems() {
    this.item_index = {};
    this.rooms.forEach((room) => {
        const oil_loc = room.randomLocationInRoom();
        const oil = new Oil(oil_loc.x, oil_loc.y);
        this.addItem(oil);
        const picture_loc = room.randomLocationInRoom();
        const pic = new Picture(picture_loc.x, picture_loc.y);
        this.addItem(pic);
    })
  }

  addItem(item) {
    this.items.push(item);
    this.item_index[item.y+"|"+item.x] = item;
  }

  getItemInLoc(x, y) {
    const t_item = this.item_index[y+"|"+x];
    if (t_item) {
      this.item_index[y+"|"+x] = undefined;
      return t_item;
    } else {
      return null;
    }
  }

  generate() {
    this.rooms = this.generateRooms(this.map);
    this.generateMaze();
    this.connectRooms(this.rooms);
    this.removeDeadEnds();
    this.generateItems();
    this.startingRoom = this.randomRoom();
    this.buildGraph();
  }

  buildGraph() {

    const isWalkable = (node) => {
      return (node != _R && node != _R_N && typeof(node) != undefined);
    }
    const edges = (y,x) => {
      const result = {};
      if(this.map[y-1] && isWalkable(this.map[y-1][x])) result[(y-1)+"|"+x] = 1; //n
      if(this.map[y+1] && isWalkable(this.map[y+1][x])) result[(y+1)+"|"+x] = 1; //s
      if(isWalkable(this.map[y][x+1])) result[y+"|"+(x+1)] = 1; //e
      if(isWalkable(this.map[y][x-1])) result[y+"|"+(x-1)] = 1; //w
      return result;
    }

    this.graph = new Graph();
    this.map.forEach((row,y) => {
      row.forEach((node,x) => {
        if (isWalkable(node)) {
          this.graph.addVertex(y+"|"+x, edges(y,x))
        }
      })
    })
  }

  randomRoom() {
    return this.rooms[Math.round(rd() * (this.rooms.length - 1))]
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
    this.renderItems();
    this.renderCharacters();
    this.renderPlayerLightRadius();
  }

  renderMap() {
    const map = this.map;
    const p = this.player;
    this.ctx.fillStyle = C[_BG];
    this.ctx.fillRect(1, 1, MAP_SIZE * TS, MAP_SIZE * TS);
    for (let y = fl(this.vpStart("y")); y < fl(this.vpStart("y")) + VIEWPORT - _; y++) {
      for (let x = fl(this.vpStart("x")); x < fl(this.vpStart("x")) + VIEWPORT - _; x++) {
        if (map[y] && map[y][x]) {
          const lx = this.vpAdjust(x,"x") * TS;
          const ly = this.vpAdjust(y,"y") * TS;
          if (C[map[y][x]]){this.ctx.fillStyle=C[map[y][x]]; this.ctx.fillRect(lx, ly, TS+_, TS+_);};
          if (IMG[map[y][x]]) this.ctx.drawImage(IMG[map[y][x]], lx-_, ly-_, TS+_, TS+_);
          if (map[y][x] == _D || map[y][x] == _B) {
            //its a door
            const status = (map[y][x] == _D) ? 0 : 1;
            const d_dir = (map[y - 1][x] == _O || map[y + 1][x] == _O) ? "ns":"ew";
            this.ctx.drawImage(...this["s_door_"+d_dir].getDrawArgsForIndex(status, lx, ly))
          }
        }

      }
    }
  }

  renderCharacters() {
    this.characters.forEach((c) => {
      const x = this.vpAdjustRealCoord(c.loc.x, "x");
      const y = this.vpAdjustRealCoord(c.loc.y, "y");
      c.drawSprite(this.ctx, x, y);
    })
  }

  renderItems() {
    this.items.forEach((item) => {
      if (!this.item_index[item.y+"|"+item.x]) return;
      const x = this.vpAdjust(item.x, "x") * TS;
      const y = this.vpAdjust(item.y, "y") * TS;
      this.ctx.drawImage(item.img, x, y);
    })
  }

  vpAdjust(val, axis) {
    return val - this.vpStart(axis);
  }

  vpAdjustRealCoord(val, axis) {
    return val - this.vpStart(axis) * TS;
  }

  vpStart(axis) {
    let result = this.player.loc[axis] / TS - (VIEWPORT / 2.5) + _;
    if (result < 0) result = 0;
    return result;
  }

  renderPlayerLightRadius() {
    if (!this.player) return false;
    const p = this.player;
    const loc = p.loc;
    const x = this.vpAdjustRealCoord(loc.x, "x") + TS / 4;
    const y = this.vpAdjustRealCoord(loc.y, "y") + TS / 4;
    const FLICKER_VARIANCE = 0.12;
    const TORCH = 3 - (p.torch - 10) * 0.30;

    const gradient = this.ctx.createRadialGradient(x, y, VIEWPORT_SIZE / (TORCH + (rd()*FLICKER_VARIANCE)), x, y, 0);
    gradient.addColorStop(0,"black");
    gradient.addColorStop(1,"rgba(0,0,0,0)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - VIEWPORT_SIZE / 2, y - VIEWPORT_SIZE / 2, VIEWPORT_SIZE * 2, VIEWPORT_SIZE * 2);
  }
}

class Game {

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game_text = "";
    this.current_consecutive_game = 0;
    this.game_active = true;
    this.TORCH_DEGRADE_INTERVAL = 12000 //seconds
    this.TORCH_DEGRADE_RATE = 4 //out of ten

    this.TEXT_PRINT_INTERVAL = 500;
    this.OBJECTIVE_GOAL = 12;
    this.changeDirection = this.changeDirection.bind(this);
    this.stopMovement = this.stopMovement.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.bindKeys();
    this.dirTransform = {
      "w": "n",
      "a": "w",
      "s": "s",
      "d": "e",
      "e": "e"
    }
    this.gameStartScreen();
  }

  audioSetup() {
    this.aCtx = new AudioContext();
    this.ma_osc = this.aCtx.createOscillator();
    this.ma_gain = this.aCtx.createGain();
    this.ma_panner = this.aCtx.createPanner();
    this.ma_panner.panningModel = 'HRTF';
    this.ma_panner.refDistance = 1;
    this.ma_panner.maxDistance = MAP_SIZE;
    this.ma_osc.frequency.value = 35.75;
    this.ma_gain.gain.value = 2;
    this.ma_osc.type = 'triangle';

    this.ma_osc.connect(this.ma_gain);
    this.ma_gain.connect(this.ma_panner);
    this.ma_panner.connect(this.aCtx.destination);

    this.aCtx.listener.setPosition(this.player.loc.x / TS, this.player.loc.y / TS, 0);
    this.ma_osc.start(0);
  }

  gameLoop() {
    if (!this.game_active) return;
    this.level.render();
    this.torchLoop();
    this.textLoop();
    this.monsterSoundAura();
    if (this.monster) this.AI(this.monster, this.player, this.level, this.level.ctx);
    setTimeout(() => {
      window.requestAnimationFrame(this.gameLoop);
    },50)
  }

  loseGame() {
    this.game_active = false;
    this.current_consecutive_game++;
    this.level = new Dungeon(this.canvas);
    this.gameOverScreen();
  }
  gameStartScreen() {
    const handler = (evt) => {if (evt.key == "e") {document.removeEventListener("keypress",handler); this.gameStartScreenOn = false; this.game_active=true; this.newGame()}}
    document.addEventListener("keypress", handler);
    this.gameStartScreenOn = true;
    const render = () => {
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(0,0,1000,1000);
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "83px Courier"
      this.ctx.fillText("Are You Lost?", 70, 300);
      this.ctx.font = "18px Courier"
      this.ctx.fillText("You'll need headphones to hear me coming.", 150, 360);
      this.ctx.fillText("Use [W][A][S][D] to run away. [E] to interact.", 130, 430);
      this.ctx.font = "24px Courier"
      this.ctx.fillText("Press [E] to play with me.", 180, 530);
      this.pixelate(this.ctx, 470, 250, 300, 83, 5, rd()*3);//for the title
      this.pixelate(this.ctx, 430, 340, 160, 18, 3, rd()*3);//for the headphones reminder
      this.pixelate(this.ctx, 350, 410, 90, 18, 3, rd()*3);//run away
      this.pixelate(this.ctx, 360, 510, 180, 24, 3, rd()*3);//play with me
      if (this.gameStartScreenOn) window.requestAnimationFrame(render);
    }
    render();

  }

  newGame() {
    this.current_second = 0;
    this.objective_counter = 0;
    this.torchCounter = 0;
    this.textCounter = 0;
    this.level = new Dungeon(this.canvas);
    this.GAME_START = performance.now();
    this.game_active = true;
    this.placePlayer();
    setTimeout(() => {this.placeMonster()},1000);
    this.level.setPlayer(this.player);
    this.audioSetup();
    this.gameLoop();
  }

  gameOverScreen() {
    const handler = (evt) => {if (evt.key == "e") {
      document.removeEventListener("keypress",handler);
      this.gameOverScreenOn = false;
      this.aCtx.close();
      this.newGame();
    }}
    document.addEventListener("keypress", handler);
    this.gameOverScreenOn = true;
    const render = () => {
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(0,0,1000,1000);
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "83px Courier"
      this.ctx.fillText("I FOUND YOU", 70, 300);
      this.ctx.font = "24px Courier"
      this.ctx.fillText("Press [E] to play again.", 180, 530);
      this.pixelate(this.ctx, 70, 250, 600, 120, 10, rd()*10);//for the title
      this.pixelate(this.ctx, 360, 510, 180, 24, 3, rd()*3);//play with me
      if (this.gameOverScreenOn) window.requestAnimationFrame(render);
    }
    render();
  }
  winGame() {
    this.game_active = false;
    this.gameWinScreen();
  }
  gameWinScreen() {
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(0,0,1000,1000);
    this.ctx.fillStyle = "#000";
    this.ctx.font = "83px Courier"
    this.ctx.fillText("You made it.", 70, 300);
    this.ctx.font = "24px Courier"
    this.ctx.fillText("I'm proud of you.", 210, 530);
    document.body.style = "background-color: white;";
  }

  pixelate(ctx, l_x, l_y, w, h, size, intensity) {
    const probability_var = intensity //the closer this number is to 0.5, the less likely things will blur for this pixel. 1.8 is a good starting number.
    for(let x = l_x; x < l_x + w; x += size)
    {
      for(let y = l_y; y < l_y + h; y += size)
      {
        if ((rd() * probability_var) > 0.5) {
          const max = 0.3;
          const min = -0.3;
          var pixela = ctx.getImageData(x, y, size, size);
          const render_x = x + (rd() * max);
          const render_y = y + (rd() * max);
          var pixelb = ctx.getImageData(render_x, render_y, size, size);
          ctx.fillStyle = "rgb("+pixelb.data[0]+","+pixelb.data[1]+","+pixelb.data[2]+")";
          ctx.fillRect(x,y, size, size);
          ctx.fillStyle = "rgb("+pixela.data[0]+","+pixela.data[1]+","+pixela.data[2]+")";
          ctx.fillRect(render_x,render_y, size, size);
        }
      }

    }
  }

  AI(monster, player, level, ctx) {
    const mx = fl(monster.loc.x / TS);
    const my = fl(monster.loc.y / TS);
    const px = fl(player.loc.x / TS);
    const py = fl((player.loc.y + player.h) / TS);

    const path = level.graph.shortestPath(py+"|"+px, my+"|"+mx);
    if (!path.length && (mx != px && my != py)) {
      //monster is stuck, gotta teleport him elsewhere
      const loc = level.randomRoom().randomLocationInRoom();
      return monster.teleport(loc.x * TS, loc.y * TS);
    }
    if (path.length < 2) return this.loseGame();
    const spl = path[1].split("|");
    const nextyx = {y: spl[0], x: spl[1]};
    let dir = null;
    if      (nextyx.y < my) {dir = "n"}
    else if (nextyx.y > my) {dir = "s"}
    else if (nextyx.x < mx) {dir = "w"}
    else if (nextyx.x > mx) {dir = "e"}
    monster.move(dir);
  }

  torchLoop() {
    const elapsed_time = performance.now() - this.GAME_START;
    if (fl(elapsed_time / this.TORCH_DEGRADE_INTERVAL) > this.torchCounter) {
      this.player.torch = this.player.torch - 1;
      this.torchCounter++;
    }
  }

  monsterSoundAura() {
    if (!this.monster) return;
    this.ma_panner.setPosition((this.monster.loc.x + (this.monster.w / 2)) / TS, ((this.monster.loc.y + (this.monster.h / 2)) / TS), 0);
    this.aCtx.listener.setPosition(this.player.loc.x / TS, this.player.loc.y / TS, 0);
  }

  setText(text) {
    this.game_text = text;
    this.current_text_letter = 0;
    this.textCounter = 0;
  }

  textLoop() {
    this.level.ctx.font = "24px Courier"
    this.level.ctx.fillStyle = "white"
    this.level.ctx.fillText(this.game_text.substr(0,this.current_text_letter), 100, 750);
    const elapsed_time = performance.now() - this.GAME_START;
    if (fl(elapsed_time / this.TEXT_PRINT_INTERVAL) > this.textCounter) {
      if (this.game_text.length > this.current_text_letter) {
        this.current_text_letter++;
        this.textCounter++;
      }
    }
  }

  bindKeys() {
    document.removeEventListener("keypress",this.changeDirection)
    document.addEventListener("keypress",this.changeDirection)
    document.removeEventListener("keyup",this.stopMovement)
    document.addEventListener("keyup",this.stopMovement)
  }

  itemPickupCallback(character, item) {
    if (item instanceof Picture) {
      this.advanceObjective();
    }
  }

  advanceObjective() {
    this.objective_counter++;
    this.setText(this.monster.dialog[this.objective_counter-1])
    if (this.objective_counter >= this.OBJECTIVE_GOAL) {
      this.winGame();
    }
  }

  placePlayer() {
    this.player = new Player(this.level, this.itemPickupCallback.bind(this));
    const startingRoom = this.level.startingRoom;
    const x = startingRoom.x + fl(startingRoom.width / 2);
    const y = startingRoom.y + fl(startingRoom.height / 2);
    this.player.teleport(x * TS, y * TS);
    this.level.placeCharacter(this.player);
  }

  placeMonster() {
    const monster = new Monster(this.level);
    const loc = this.level.randomRoom().randomLocationInRoom();

    monster.teleport(loc.x * TS, loc.y * TS)
    this.level.placeCharacter(monster);
    this.monster = monster;
    let text = this.monster.ng_dialog[this.current_consecutive_game];
    if (!text) {this.current_consecutive_game = 0; text = this.monster.ng_dialog[this.current_consecutive_game]}
    this.setText(text);
  }

  stopMovement(event) {
    if (!this.player) return;
    this.player.stopMovement(this.dirTransform[event.key]);
  }

  changeDirection(event) {
    if (!this.player) return;
    const mv = this.player.move;
    if (event.key == "e") {
      this.player.interact();
    } else {
      if(this.dirTransform[event.key]) this.player.move(this.dirTransform[event.key]);
    }

  }
}

class Character {
  constructor(dungeon) {
    this.TILE = _P
    this.loc = {x:0, y:0}
    this.dungeon = dungeon;
    this.move = this.move.bind(this);
    this.interact = this.interact.bind(this);
    this.state = {moving: false, direction: "s", sprite_index: 0}
  }

  drawSprite(ctx, x, y) {
    ctx.drawImage(...this.getCurrentSpriteArgs(x, y));
  }

  getCurrentSpriteArgs(x, y) {
    if (this.state.moving) {
      return this["s_walk_"+this.state.direction].getDrawArgsForIndex(this.state.sprite_index, x, y);
    } else {
      return this.s_idle.getDrawArgsForIndex(DIR.indexOf(this.state.direction), x, y);
    }
  }

  interact() {
    const x = fl((this.loc.x + (this.w / 2)) / TS);
    const y = fl((this.loc.y + (this.h / 2)) / TS);
    const adjacent_tiles = [
      {x: x,  y: y}, //the one we're on
      {x: x,      y: y - 1}, //north
      {x: x - 1,  y: y}, //west
      {x: x,      y: y + 1}, //south
      {x: x + 1,  y: y} //east
    ];
    let action_done = false;
    adjacent_tiles.forEach((loc) => {
      if (action_done) return;
      const t_loc = this.dungeon.map[loc.y][loc.x];
      if (t_loc == _D || t_loc == _B) {
        this.dungeon.toggleDoor(loc.x, loc.y);
      }
      const item = this.dungeon.getItemInLoc(loc.x,loc.y);
      if (item) this.pickupItem(item);
    })
  }

  pickupItem(item) {
    if (item instanceof Oil) {
      if (this.torch + 4 > 12) {
        this.torch = 12;
      } else {
        this.torch += 4;
      }

    }
    this.itemPickupCallback(this, item);
  }

  move(dir) {
    if (this.state.moving && this.state.direction == dir) return false;
    let moveTime = 0;
    const moveLoop = (dir) => {
      if (this.state.moving && this.state.direction === dir) {
        const newLoc = {x: this.loc.x, y: this.loc.y};
        const SPD = this.SPEED;
        switch (dir) {
          case "n": newLoc.y = this.loc.y - SPD ; break;
          case "w": newLoc.x = this.loc.x - SPD ; break;
          case "s": newLoc.y = this.loc.y + SPD ; break;
          case "e": newLoc.x = this.loc.x + SPD ; break;
        }
        if (this.isValidLoc(newLoc)) {
          this.loc = newLoc;
        }
        if (moveTime % this.spriteCadence < 30) {
          this.nextSprite();
        }
        moveTime+=30;
        setTimeout(() => {moveLoop(dir)},30)
      }
    }
    this.state.moving = true;
    this.state.direction = dir;
    moveLoop(dir);
  }

  nextSprite() {
    if (this.state.sprite_index + 1 > 3) {
      this.state.sprite_index = 0;
    } else {
      this.state.sprite_index += 1;
    }
    return this.state.sprite_index;
  }

  stopMovement(dir) {
    if (this.state.direction === dir) {
      this.state.moving = false;
      this.state.sprite_index = false;
    }
  }

  isValidWalkingTile(t) {
    return (t == _O || t == _H || t == _B);
  }

  isValidLoc(loc) {

    const onTile = (coord) => {return fl(coord / TS)};

    const isPointValid = (x, y) => {
      if (!this.dungeon.map[y] || !this.dungeon.map[y][x]) return false;
      const d_tile = this.dungeon.map[y][x];
      return this.isValidWalkingTile(d_tile)
    }

    const x1 = onTile(loc.x); //top left corner
    const y1 = onTile(loc.y); //top left corner
    const x2 = onTile(loc.x + this.cw) //top right corner
    const y2 = y1; //top right corner
    const x3 = x1; //bottom left corner
    const y3 = onTile(loc.y + this.ch); //bottom left corner
    const x4 = x2 //bottom right corner
    const y4 = y3;  //bottom right corner

    return (isPointValid(x3,y3) && isPointValid(x4,y4));
  }

  teleport(x, y) {
    this.loc = {x: x, y: y};
  }
}

class Player extends Character {
  constructor(dungeon, itemPickupCallback) {
    super();
    const SPR = "img_prod/s_pc_";
    this.itemPickupCallback = itemPickupCallback;
    this.w = this.cw = 34;
    this.h = this.ch = 47;
    this.animated = true;
    this.SPEED = TS * 0.15;
    this.s_idle = new Sprite(SPR+"idle-min.png", this.w/2, this.h/2, this.w, this.h);
    DIR.forEach((d) => { this["s_walk_"+d] = new Sprite(SPR+"walk_"+d+"-min.png",  this.w/2, this.h/2, this.w, this.h); })
    this.dungeon = dungeon;
    this.torch = 12;
    this.spriteCadence = 100;
  }
}

class Enemy extends Character {

}

class Monster extends Enemy {
  constructor(dungeon) {
    super();
    const SPR = "img_prod/monster_walk_";
    this.animated = true;
    this.SPEED = TS * 0.09;
    this.spriteCadence = 100;
    this.w = 128;
    this.h = 64;
    this.cw = this.ch = 0;
    this.s_idle = new Sprite(SPR+"w-min.png", this.w/2, this.h/2, this.w, this.h);
    DIR.forEach((d) => {this["s_walk_"+d] = new Sprite(SPR+"w-min.png", this.w/2, this.h/2, this.w, this.h); })
    this.TILE = E_S;
    this.dungeon = dungeon;
    this.dialog = [
      "oh, I wouldn't do that...",
      "you'll hurt yourself running like that.",
      "what is it you're trying to do?",
      "i'll find you eventually.",
      "i always do...",
      "it's rude to run you know",
      "You are getting closer.",
      "Why do you want to run from me?",
      "You won't find the next one.",
      "I like the way you wriggle when you run.",
      "You won't get out of here",
    ]
    this.ng_dialog = [
      "I can smell you.",
      "oh... you're back.",
      "I just want to talk this time, I promise..."
    ]
  }

  isValidWalkingTile(t) {
    return (t == _O || t == _H || t == _B || t == _D); //room, hallway, open door, or closed door
  }

  drawSprite(ctx, x, y) {
    ctx.drawImage(...this.getCurrentSpriteArgs(x, y));
  }
}


const canvas = document.getElementById("game");
const g = new Game(canvas);
