/*GAME CODE*/

function GameArea() {
  this.container = document.createElement("div");
  this.canvas = document.createElement("canvas");
  this.controls = document.createElement("div");
  this.context = this.canvas.getContext("2d");

  this.obstacles = [];
  this.obstacleSpawnRate = 150;
  this.obstacleMinHeight = 20; this.obstacleMaxHeight = 200;
  this.obstacleMinGap = 50; this.obstacleMaxGap = 100;

  this.movementSpeed = 1;

  this.score;
  this.direction;
  this.frameCount = 0;

  this.start = function() {
    let createControl = function(label, args) {
      let button = document.createElement("button");
      button.innerText = label;

      for (let arg of args) {
        button.addEventListener(arg.input, arg.val);
      }
      this.controls.appendChild(button);
    }.bind(this);

    this.gamePiece = new GameComponent (30, 30, "red", 10, 120, "player", this.context);
    this.score = new GameComponent ("30px", "Consolas", "black", 280, 40, "text", this.context);
    this.direction = new GameComponent ("30px", "Consolas", "black", 280, 80, "text", this.context);

    createControl ("left", [
      {input: "mousedown", val: function() { this.gamePiece.move("left"); }.bind(this) }
    ]);
    createControl ("right", [
      {input: "mousedown", val: function() { this.gamePiece.move("right"); }.bind(this) }
    ]);
    createControl ("up", [
      {input: "mousedown", val: function() { this.gamePiece.move("up"); }.bind(this) }
    ]);
    createControl ("down", [
      {input: "mousedown", val: function() { this.gamePiece.move("down"); }.bind(this) }
    ]);

    this.canvas.width = 480; this.canvas.height = 270;

    this.container.appendChild(this.canvas);
    this.container.appendChild(this.controls);
    document.body.insertBefore(this.container, document.body.childNodes[0]); //Sus, can be changed later
    this.interval = setInterval(this.update, 20);
  }.bind(this);

  this.update = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.frameCount % this.obstacleSpawnRate == 1) {
      let height = this.obstacleMinHeight + (Math.random() * (this.obstacleMaxHeight - this.obstacleMinHeight) );
      let gap = this.obstacleMinGap + (Math.random() * (this.obstacleMaxGap - this.obstacleMinGap) );

      let upper = new GameComponent (
        10, height, "green", this.canvas.width, 0, "obstacle", this.context
      );
      upper.speed.x = -1;
      this.obstacles.push(upper);

      let lower = new GameComponent (
        10, this.canvas.width - height - gap, "green", this.canvas.width, height+gap, "obstacle", this.context
      );
      lower.speed.x = -1;
      this.obstacles.push(lower);
    }
    for (let obstacle of this.obstacles) {
      if (obstacle.pos.x + obstacle.width > 0) {
        obstacle.update();
        if (this.gamePiece.isIntersecting(obstacle) ) {
          this.stop();
        }
      } else {
        this.obstacles.splice(this.obstacles.indexOf(obstacle), 1);
      }
    }

    switch (results[0].label) {
      case 'Up': { this.gamePiece.move('up'); break; }
      case 'Down': { this.gamePiece.move('down'); break; }
      case 'Left': { this.gamePiece.move('left'); break; }
      case 'Right': { this.gamePiece.move('right'); break; }
      default: { break; }
    }

    this.gamePiece.update();

    this.score.text = "SCORE: " + this.frameCount;
    this.direction.text = results[0].label;
    this.score.update();
    this.direction.update();

    this.frameCount++;
  }.bind(this);

  this.stop = function() {
    clearInterval(this.interval);
  }.bind(this);
}

function GameComponent (width, height, color, x, y, type, context) {
  this.type = type;
  this.width = width;
  this.height = height;
  this.pos =  {
    x: x, y: y
  }
  this.speed = {
    x: 0, y: 0
  }

  this.context = context;
  this.context.fillStyle = color;
  this.context.fillRect(this.pos.x, this.pos.y, this.width, this.height);

  this.update = function() {
    this.pos.x += this.speed.x;
    this.pos.y += this.speed.y;
    context.fillStyle = color;

    if (this.type == "text") {
      this.context.font = this.width + " " + this.height; //Janky
      this.context.fillText(this.text, this.pos.x, this.pos.y);
    } else {
      context.fillRect(this.pos.x, this.pos.y, this.width, this.height);
    }
  }

  this.move = function(dir) {
    switch(dir) {
      case 'up': { this.pos.y -= 1; break; }
      case 'down': { this.pos.y += 1; break; }
      case 'left': { this.pos.x -= 1; break; }
      case 'right': { this.pos.x += 1; break; }
      default: { break; }
    }
  }

  this.isIntersecting = function(other) {
    let bounds = {
      left: this.pos.x,
      right: this.pos.x + this.width,
      top: this.pos.y,
      bottom: this.pos.y + this.height
    };
    let otherBounds = {
      left: other.pos.x,
      right: other.pos.x + other.width,
      top: other.pos.y,
      bottom: other.pos.y + other.height
    }

    return !(
      bounds.bottom < otherBounds.top ||
      bounds.top > otherBounds.bottom ||
      bounds.right < otherBounds.left ||
      bounds.left > otherBounds.right
    )
  }
}

function startGame() {
  game = new GameArea();
  game.start();
}

/*
ML5 CODE
*/

let video;
let classifier;
let modelURL = 'https://teachablemachine.withgoogle.com/models/c1UFnt9Ht/';
let results;

function preload() {
  classifier = ml5.imageClassifier(modelURL + 'model.json', modelLoaded);
}

function modelLoaded() {
  console.log("Video classifier loaded!");
  startGame();
  classifyVideo();
}

function setup() {
  createCanvas(640, 520);
  video = createCapture(VIDEO);
  video.hide();
}

function draw() {
  background(0);
  image(video, 0, 0);
}

function classifyVideo() {
  classifier.classify(video, function(err, val) {
    if(err) { throw(err); }
    results = val;
    classifyVideo();
  });
}
