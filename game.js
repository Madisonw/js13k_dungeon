//TODO add the OIL
//TODO add the pictures
//TODO monster AI
//TODO actual monster artwork
const img = (uri) => {const i = new Image(); i.src = uri; return i; }
const IMG_FLOOR = img("img_prod/floor-min.png");
const IMG_WALL_N = img("img_prod/wall_n.png");
const IMG_WALL_ANY = img("img_prod/wall_any.png");
const TILE_SIZE = 64,
      PLAYER_SIZE = TILE_SIZE / 2,
      MAP_SIZE = 50,
      VIEWPORT = 18,
      VIEWPORT_SIZE = TILE_SIZE * VIEWPORT,
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
      C[_R] = "black"; //Rock Color
      C[_D] = "#513520"; //Door Color
      C[_B] = "#c1ad9e"; //Open Door Color
      C[_P] = "orange"; //Door Color
      IMG[_O] = IMG_FLOOR
      IMG[_H] = IMG_FLOOR
      IMG[_R_N] = IMG_WALL_N
      IMG[_R] = IMG_WALL_ANY
      IMG[_D] = IMG_FLOOR
      IMG[_B] = IMG_FLOOR

class Sprite {
  constructor(src, width, height) {
    this.img = new Image();
    this.img.src = src;
    this.width = width;
    this.height = height;
    this.getDrawArgsForIndex = this.getDrawArgsForIndex.bind(this);
  }

  getDrawArgsForIndex(frame_index, dest_x, dest_y) {
    const w = this.width;
    const h = this.height;
    return [
      this.img,
      frame_index * w, //frame index times frame width
      0,
      w,
      h,
      dest_x,
      dest_y,
      w,
      h
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
    this.img = img("img_prod/oil.png");
  }
}

class Picture extends Item {
  constructor(x, y) {
    super(x, y);
    this.img = img("img_prod/picture.png");
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
      x: this.x + Math.floor(Math.random() * this.width),
      y: this.y + Math.floor(Math.random() * this.height)
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
    this.s_door_ns = new Sprite("img_prod/s_doors_ns.png", TILE_SIZE, TILE_SIZE);
    this.s_door_ew = new Sprite("img_prod/s_doors_ew.png", TILE_SIZE, TILE_SIZE);
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
      return DIR[Math.round(Math.random() * DIR.length)];
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
  }

  generate() {
    this.rooms = this.generateRooms(this.map);
    this.generateMaze();
    this.connectRooms(this.rooms);
    this.removeDeadEnds();
    this.generateItems();
    this.startingRoom = this.randomRoom();
  }

  randomRoom() {
    return this.rooms[Math.round(Math.random() * (this.rooms.length - 1))]
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
    this.ctx.fillRect(1, 1, MAP_SIZE * TILE_SIZE, MAP_SIZE * TILE_SIZE);
    for (let y = Math.floor(this.vpStart("y")); y < Math.floor(this.vpStart("y")) + VIEWPORT - _; y++) {
      for (let x = Math.floor(this.vpStart("x")); x < Math.floor(this.vpStart("x")) + VIEWPORT - _; x++) {
        if (map[y] && map[y][x]) {
          const lx = this.vpAdjust(x,"x") * TILE_SIZE;
          const ly = this.vpAdjust(y,"y") * TILE_SIZE;
          this.ctx.drawImage(IMG[map[y][x]], lx, ly, TILE_SIZE, TILE_SIZE);
          if (map[y][x] == _D || map[y][x] == _B) {
            //its a door
            const status = (map[y][x] == _D) ? 0 : 1;
            if (map[y - 1][x] == _O || map[y + 1][x] == _O) {
              //it's a north-south door
              this.ctx.drawImage(...this.s_door_ns.getDrawArgsForIndex(status, lx, ly))
            } else {
              //its an east-west door
              this.ctx.drawImage(...this.s_door_ew.getDrawArgsForIndex(status, lx, ly))
            }
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
      const x = this.vpAdjust(item.x, "x") * TILE_SIZE;
      const y = this.vpAdjust(item.y, "y") * TILE_SIZE;
      this.ctx.drawImage(item.img, x, y);
    })
  }

  vpAdjust(val, axis) {
    return val - this.vpStart(axis);
  }

  vpAdjustRealCoord(val, axis) {
    return val - this.vpStart(axis) * TILE_SIZE;
  }

  vpStart(axis) {
    let result = this.player.loc[axis] / TILE_SIZE - (VIEWPORT / 2.5) + _;
    if (result < 0) result = 0;
    return result;
  }

  renderPlayerLightRadius() {
    if (!this.player) return false;
    const p = this.player;
    const loc = p.loc;
    const x = this.vpAdjustRealCoord(loc.x, "x") + TILE_SIZE / 4;
    const y = this.vpAdjustRealCoord(loc.y, "y") + TILE_SIZE / 4;
    const FLICKER_VARIANCE = 0.12;
    const TORCH = 3 - (p.torch - 10) * 0.30;

    const gradient = this.ctx.createRadialGradient(x, y, VIEWPORT_SIZE / (TORCH + (Math.random()*FLICKER_VARIANCE)), x, y, 0);
    gradient.addColorStop(0,"black");
    gradient.addColorStop(1,"rgba(0,0,0,0)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - VIEWPORT_SIZE / 2, y - VIEWPORT_SIZE / 2, VIEWPORT_SIZE * 2, VIEWPORT_SIZE * 2);
  }
}

class Game {

  constructor(level, player) {

    this.game_text = "";
    this.current_consecutive_game = 0;
    this.TORCH_DEGRADE_INTERVAL = 12 //seconds
    this.TORCH_DEGRADE_RATE = 1 //out of ten
    this.GAME_START = performance.now();
    this.current_second = 0;
    this.changeDirection = this.changeDirection.bind(this);
    this.stopMovement = this.stopMovement.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.level = level;
    this.player = player;
    this.bindKeys();
    this.placePlayer();
    setTimeout(() => {this.placeMonster()},1000);
    this.level.setPlayer(player);
    this.audioSetup();
    this.gameLoop();
    this.dirTransform = {
      "w": "n",
      "a": "w",
      "s": "s",
      "d": "e",
      "e": "e"
    }
  }

  audioSetup() {
    this.aCtx = new AudioContext();
    this.ma_osc = this.aCtx.createOscillator();
    this.ma_gain = this.aCtx.createGain();
    this.ma_panner = this.aCtx.createPanner();
    this.ma_panner.panningModel = 'HRTF';
    this.ma_panner.distanceModel = 'inverse';
    this.ma_panner.refDistance = 1;
    this.ma_panner.maxDistance = MAP_SIZE;
    this.ma_panner.rolloffFactor = 1;
    this.ma_panner.coneInnerAngle = 360;
    this.ma_panner.coneOuterAngle = 0;
    this.ma_panner.coneOuterGain = 0;
    this.ma_osc.frequency.value = 35.75;
    this.ma_gain.gain.value = 2;
    this.ma_osc.type = 'triangle';

    this.ma_osc.connect(this.ma_gain);
    this.ma_gain.connect(this.ma_panner);
    this.ma_panner.connect(this.aCtx.destination);

    this.aCtx.listener.setPosition(this.player.loc.x / TILE_SIZE, this.player.loc.y / TILE_SIZE, 0);
    this.ma_osc.start(0);
  }

  gameLoop() {
    this.level.render();
    this.torchLoop();
    this.textLoop();
    this.monsterSoundAura();
    window.requestAnimationFrame(this.gameLoop);
  }

  torchLoop() {
    const second = Math.floor(Math.floor(performance.now() - this.GAME_START) / 1000);
    if (second > this.current_second) {
      if ((this.current_second % this.TORCH_DEGRADE_INTERVAL === 0)) {
        this.player.torch = this.player.torch - 1;
      }
    }
  }

  monsterSoundAura() {
    if (!this.monster) return;
    this.ma_panner.setPosition((this.monster.loc.x + (this.monster.w / 2)) / TILE_SIZE, ((this.monster.loc.y + (this.monster.h / 2)) / TILE_SIZE), 0);
    this.aCtx.listener.setPosition(this.player.loc.x / TILE_SIZE, this.player.loc.y / TILE_SIZE, 0);
  }

  setText(text) {
    this.game_text = text;
    this.current_text_letter = 0;
  }

  textLoop() {
    this.level.ctx.font = "24px Courier"
    this.level.ctx.fillStyle = "white"
    this.level.ctx.fillText(this.game_text.substr(0,this.current_text_letter), 100, 750);
    const second = Math.floor(Math.floor(performance.now() - this.GAME_START) / 1000);
    if (second > this.current_second && this.current_second % 1 === 0) {
      if (this.game_text.length > this.current_text_letter) {
        this.current_text_letter += 1;
      }
      this.current_second = second;
    }
  }

  bindKeys() {
    document.addEventListener("keypress",this.changeDirection)
    document.addEventListener("keyup",this.stopMovement)
  }

  placePlayer() {
    const startingRoom = this.level.startingRoom;
    const x = startingRoom.x + Math.floor(startingRoom.width / 2);
    const y = startingRoom.y + Math.floor(startingRoom.height / 2);
    this.player.teleport(x * TILE_SIZE, y * TILE_SIZE);
    this.level.placeCharacter(this.player);
  }

  placeMonster() {
    const monster = new Monster();
    //const loc = this.level.randomRoom().randomLocationInRoom();
    const loc = this.player.loc;
    monster.teleport(loc.x, loc.y)
    this.level.placeCharacter(monster);
    this.monster = monster;
    this.setText(this.monster.ng_dialog[this.current_consecutive_game]);
  }

  stopMovement(event) {
    this.player.stopMovement(this.dirTransform[event.key]);
  }

  changeDirection(event) {
    const mv = this.player.move;
    if (event.key == "e") {
      this.player.interact();
    } else {
      this.player.move(this.dirTransform[event.key]);
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
    const x = Math.floor((this.loc.x + (this.w / 2)) / TILE_SIZE);
    const y = Math.floor((this.loc.y + (this.h / 2)) / TILE_SIZE);
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
    })
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
        if (moveTime % this.footstepCadence < 30 && this.footstep) {
          this.footstep.play();
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

  isValidLoc(loc) {

    const onTile = (coord) => {return Math.floor(coord / TILE_SIZE)};

    const isPointValid = (x, y) => {
      if (!this.dungeon.map[y] || !this.dungeon.map[y][x]) return false;
      const d_tile = this.dungeon.map[y][x];
      return (d_tile == _O || d_tile == _H || d_tile == _B); //room, hallway, or open door tile.
    }

    const x1 = onTile(loc.x); //top left corner
    const y1 = onTile(loc.y); //top left corner
    const x2 = onTile(loc.x + 34) //top right corner
    const y2 = y1; //top right corner
    const x3 = x1; //bottom left corner
    const y3 = onTile(loc.y + 47); //bottom left corner
    const x4 = x2 //bottom right corner
    const y4 = y3;  //bottom right corner

    return (isPointValid(x3,y3) && isPointValid(x4,y4));
  }

  teleport(x, y) {
    this.loc = {x: x, y: y};
  }
}

class Player extends Character {
  constructor(dungeon) {
    super();
    const SPR = "img_prod/s_pc_";
    this.w = 34;
    this.h = 47;
    this.animated = true;
    this.SPEED = TILE_SIZE * 0.15;
    this.s_idle = new Sprite(SPR+"idle-min.png", this.w, this.h);
    DIR.forEach((d) => { this["s_walk_"+d] = new Sprite(SPR+"walk_"+d+"-min.png", this.w, this.h); })
    this.dungeon = dungeon;
    this.torch = 12;
    this.footstep = new Audio("audio_prod/footstep.mp3");
    this.footstep.volume = 0.2;
    this.footstepCadence = 100;
    this.spriteCadence = 100;
  }
}

class Enemy extends Character {

}

class Monster extends Enemy {
  constructor() {
    super();
    this.animated = true;
    this.w = 200;
    this.h = 200;
    this.s_idle = new Sprite("slenderman.png", this.w, this.h);
    this.TILE = E_S;
    this.dialog = [
      "oh, I wouldn't do that...",
      "you'll hurt yourself running like that.",
      "what is it you're trying to do?",
      "i'll find you eventually.",
      "i always do...",
      "it's rude to run you know"
    ]
    this.ng_dialog = [
      "are you lost...?",
      "oh... you're back.",
      "I just want to talk this time, I promise..."
    ]
  }

  pixelate(ctx, l_x, l_y, w, h, blocksize) {
    const sq_size = 7;
    for(let x = l_x; x < l_x + w; x += blocksize)
    {
      for(let y = l_y; y < l_y + h; y += blocksize)
      {
          const max = 0.5;
          const min = -0.5;
          const random_x = Math.round(Math.random() * w)
          const random_y = Math.round(Math.random() * h);
          var pixel = ctx.getImageData(x + random_x, y + random_y, 1, 1);
          ctx.fillStyle = "rgb("+pixel.data[0]+","+pixel.data[1]+","+pixel.data[2]+")";
          const render_x = random_x + (Math.random() * (max - min) + min);
          const render_y = random_y + (Math.random() * (max - min) + min);
          ctx.fillRect(x + render_x, y + render_y, sq_size, sq_size);
      }

    }
  }

  drawSprite(ctx, x, y) {
    ctx.drawImage(...this.getCurrentSpriteArgs(x, y));
    this.pixelate(ctx, x-(this.w/2), y-(this.h/2), this.w, this.h, 5)
  }
}


const canvas = document.getElementById("game");
const d = new Dungeon(canvas);
const g = new Game(d, new Player(d));
