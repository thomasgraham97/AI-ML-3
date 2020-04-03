/*
GAME CODE. ML5 Code at bottom.
*/
function GameArea() {

  //DOM Setup
  this.container = document.createElement("div");
  this.canvas = document.createElement("canvas");
  this.context = this.canvas.getContext("2d");

  //Obstacles
  this.obstacles = [];
  this.obstacleSpawnRate = 150;
  this.obstacleMinHeight = 20; this.obstacleMaxHeight = 200;
  this.obstacleMinGap = 50; this.obstacleMaxGap = 100;

  this.score; //Canvas object for score
  this.frameCount = 0;

  /*
  Start function
  */
  this.start = function() {
    //Create static canvas objects: player and score
    this.gamePiece = new GameComponent (30, 30, "red", 10, 120, "player", this.context);
    this.score = new GameComponent ("30px", "Consolas", "black", 280, 40, "text", this.context);

    //Create canvas
    this.canvas.width = 480; this.canvas.height = 270;

    //String together into DOM
    this.container.appendChild(this.canvas);
    document.body.insertBefore(this.container, document.body.childNodes[0]); //#TODO: Less janky

    //Set canvas to update every 20ms
    this.interval = setInterval(this.update, 20);
    console.log("Game started!");
  }.bind(this); //Using the bind method to maintain scope

  /*
  Update function
  */
  this.update = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //Generate obstacles per spawn rate
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

    //Update and draw player piece
    this.gamePiece.update();

    //Update and draw obstacles
    for (let obstacle of this.obstacles) {
      if (obstacle.pos.x + obstacle.width > 0) {
        obstacle.update();
        if (this.gamePiece.isIntersecting(obstacle) ) {
          console.log ("Player is intersecting obstacle!");
          this.stop();
        }
      } else { //Remove obstacles once out of frame
        this.obstacles.splice(this.obstacles.indexOf(obstacle), 1);
      }
    }

    this.score.text = "SCORE: " + this.frameCount;
    this.score.update();

    this.frameCount++;
  }.bind(this);

  /*
  Stop game
  */
  this.stop = function() {
    clearInterval(this.interval);
    console.log("Game stopped!");
  }.bind(this);
}

//Covers all canvas objects
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
  this.gravity = 0;

  if (this.type == "player") {
    this.gravity = 0.05;
  }

  this.context = context;
  this.context.fillStyle = color;
  this.context.fillRect(this.pos.x, this.pos.y, this.width, this.height);

  this.update = function() {
    this.speed.y += this.gravity;
    if (this.type == "player") {
      //Check if next step of movement will put player out of bounds
      if ( !this.willExitBounds(this.pos.x + this.speed.x, this.pos.y) ) {
        this.pos.x += this.speed.x;
      } else {
        this.speed.x *= -0.5; //If so, bounce off wall according to speed
      }
      if ( !this.willExitBounds(this.pos.x, this.pos.y + this.speed.y)) {
        this.pos.y += this.speed.y;
      } else {
        this.speed.y *= -0.5;
      }
    } else {
      this.pos.x += this.speed.x;
      this.pos.y += this.speed.y;
    }

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
      case 'up': { this.speed.y -= 10; break; }
      case 'down': { this.speed.y += 10; break; }
      case 'left': { this.speed.x -= 10; break; }
      case 'right': { this.speed.x += 10; break; }
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

  this.willExitBounds = function(dx, dy) {
    return (
      dy > this.context.canvas.height - this.height ||
      dy < 0 ||
      dx > this.context.canvas.width - this.width ||
      dx < 0
    );
  }
}

function Game() {
  let game = new GameArea();
  game.start();

  return game;
}

let game;

/*
ML5 CODE. Control code under classifyAudio().
*/

let classifier;
let modelURL = 'https://teachablemachine.withgoogle.com/models/3Y0szlIi4/';

function preload() {
  classifier = ml5.soundClassifier(modelURL + 'model.json', modelLoaded);
} //Found this rework in The Code Train's CodeBox upload, fixed a CORS error

function setup() {
  createCanvas(500, 500);
}

function modelLoaded() {
  console.log("Audio classifier loaded!");
  classifyAudio();
  game = new Game();
}

function classifyAudio() {
  classifier.classify(function(err, val) {
    if(err) { throw(err); } else { //If no error
      if (val[0].label == "Clap") { //And top result's label is "Clap"
        game.gamePiece.move("up"); //Jump!
      }
    }
  });
}
