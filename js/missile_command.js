window.requestAnimFrame = (function(){ 
  return  window.requestAnimationFrame       ||  
          window.webkitRequestAnimationFrame ||  
          window.mozRequestAnimationFrame    ||  
          window.oRequestAnimationFrame      ||  
          window.msRequestAnimationFrame     ||  
          function( callback ){ 
            window.setTimeout(callback, 1000 / 60); 
          }; 
})(); 

var Vector2 = function(){
  this.x = arguments[0];
  this.y = arguments[1];
  this.length = null;

  this.normalize = function() {
    this.length = Math.sqrt(Math.pow(this.x, 2) + 
                            Math.pow(this.y, 2))
    this.x = this.x/this.length;
    this.y = this.y/this.length;
  };

  this.distance = function(vector){
    return Math.sqrt(Math.pow(this.x - vector.x, 2) + 
                     Math.pow(this.y - vector.y, 2));
  };
};

var missileCommand = (function (){
  var canvas = document.getElementById('canvas'); 
  var c = canvas.getContext('2d');
  var ground = new Image();
  ground.src = "img/ground1.png";

  var Missile = function(startLocation, destination, speed) {
    this.color = "white";
    this.startLocation = startLocation;
    this.destination = destination;
    this.x = startLocation.x;
    this.y = startLocation.y;
    this.alive = true;
    this.speed = speed || 600;
    

    this.directionVector = new Vector2( this.x - destination.x, 
                                        this.y - destination.y);
    this.directionVector.normalize();


    this.update = function(deltaTime) {
      this.x -= this.directionVector.x * this.speed * deltaTime.seconds;
      this.y -= this.directionVector.y * this.speed * deltaTime.seconds;
     if(this.y < this.destination.y){ //only check if above destinaion as we don't 
      this.alive = false;              //know what side we started on
      
     };
    };

    this.draw = function(){
      c.beginPath();
      c.arc(this.x, this.y, 3, 0, Math.PI*2);
      c.closePath();
      c.fillStyle = "white";
      c.fill();
    };

    this.isAlive = function() {
      return this.alive;
    };

    this.kill = function() {
      this.alive = false;
      return new Explosion(new Vector2(this.x, this.y));
    };

    this.location = function() {
      return new Vector2(this.x, this.y);
    }

  };

  var Explosion = function(location, startRadius, maxRadius, explosionSpeed) {
    this.radius = startRadius || 5;
    this.maxRadius = maxRadius || 27;
    this.location = location;
    this.x = location.x;
    this.y = location.y;
    this.speed = explosionSpeed || 65;
    this.alive = true;

    this.update = function(deltaTime) {
      this.radius += this.speed * deltaTime.seconds;
      if(this.radius > this.maxRadius) {
        this.alive = false;
      }

      //TODO check collision
    };

    this.draw = function() {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI*2);
      c.closePath();
      c.fillStyle = "red";
      c.fill();
    };

    this.isAlive = function() {
      return this.alive;
    };

    this.kill = function() {
      this.alvine = false;
    };

    this.hit = function(vector) {
      if(this.location.distance(vector) < this.radius){
        return true;
      } else {
        return false;
      }
    };

  };

  var Bomb = function(startLocation, endLocation, speed) {
    this.speed = speed || 50;
    this.startLocation = startLocation;
    this.endLocation = endLocation;
    this.x = startLocation.x;
    this.y = startLocation.y;
    this.alive = true;

    this.directionVector = new Vector2(startLocation.x - endLocation.x, 
                                       startLocation.y - endLocation.y);
    this.directionVector.normalize();

    this.update = function(deltaTime) {
      this.x -= this.directionVector.x * this.speed * deltaTime.seconds;
      this.y -= this.directionVector.y * this.speed * deltaTime.seconds;
      if(this.y > this.endLocation.y) {
        this.alive = false;
      }
    };

    this.draw = function() {
      if(this.alive) {
        //bomb
        c.beginPath();
        c.arc(this.x, this.y, 2, 0, Math.PI*2);
        c.closePath();
        c.fillStyle = "yellow";
        c.fill();
        //path
        c.beginPath();
        c.moveTo(startLocation.x, startLocation.y);
        c.lineTo(this.x, this.y);
        c.strokeStyle = "#4DB8B8";
        c.stroke();
      }
    };

    this.isAlive = function() {
      return this.alive;
    };

    this.kill = function() {
      if(this.alive){
        this.alive = false;
        return new Explosion(new Vector2(this.x, this.y));
      }
    };

    this.location = function() {
      return new Vector2(this.x, this.y);
    };
  };

  var Game = function() {
    this.missiles     = [];
    this.bombs        = [];
    this.explosions   = [];
    this.score        = 0;

    this.lastUpdate;
    this.lastBomb     = 1000;
    this.bombsToAdd   = 1;
    this.bombInterval = 2;
    this.gameRunnning = true;

    this.run = function() {
      window.requestAnimFrame(gameLoop.bind(this));

      function gameLoop() {
        window.requestAnimFrame(gameLoop.bind(this));
        var now = new Date().getTime()
        var time = now - (this.lastUpdate || now);
        var deltaTime = {time: time, seconds: time/1000 }
        this.update(deltaTime);
        this.lastUpdate = now;
      };

    };

    this.update = function(deltaTime) {
      //paint background
      c.fillStyle = "black";
      c.fillRect(0, 0, canvas.width, canvas.height);
      //paint ground
      c.drawImage(ground, 0, 550);
      //score
      c.fillStyle = "#B20000";
      c.font = "bold 10pt Courier";
      c.fillText("score: " + this.score, 450, 580);

      this.createBombs(deltaTime);

      //go backward so anything added or removed will not effect loop
      for(var idx = this.missiles.length - 1; idx >= 0; idx--) {
        this.missiles[idx].update(deltaTime);
        this.missiles[idx].draw();
        if(!this.missiles[idx].isAlive()) {
          var gameObject = this.missiles.splice(idx, 1);
          var returnedObject = gameObject[0].kill();
          if(returnedObject) {
            this.addExplosion(returnedObject);
          }
        };
      }

      for(var idx = this.explosions.length - 1; idx >= 0; idx--) {
        this.explosions[idx].update(deltaTime);
        this.explosions[idx].draw();
        for (var i = 0; i < this.bombs.length; i++) {
          if(this.explosions[idx].hit(this.bombs[i].location())) {
            this.score += 10;
            this.addExplosion(this.bombs[i].kill());
            this.bombs.splice(i, 1);
          }
        }
        if(!this.explosions[idx].isAlive()) {
          this.explosions.splice(idx, 1);
        }
      }

      for(var idx = this.bombs.length - 1; idx >= 0; idx--) {
        this.bombs[idx].update(deltaTime);
        this.bombs[idx].draw();
        if(!this.bombs[idx].isAlive()) {
          var gameObject = this.bombs.splice(idx, 1);
          var returnedObject = gameObject[0].kill();
          if(returnedObject) {
            this.addExplosion(returnedObject);
          }
        };
      }

    };

    this.createBombs = function(deltaTime) {
      this.lastBomb += deltaTime.seconds;
      if(this.lastBomb > this.bombInterval) {
        for(var i = 0; i <= this.bombsToAdd; i++) {
          var startLoc = new Vector2(Math.random() * (canvas.width - 4), 0);
          var endLoc   = new Vector2(Math.random() * (canvas.width - 4), 550);
          this.bombs.push(new Bomb(startLoc, endLoc))
          this.lastBomb = 0;
        }
      }
    };

    this.addExplosion = function(explosion) {
      if(explosion) {
        this.explosions.push(explosion);
      }
    };

    this.mouseClick = function(eventData) {
      this.missiles.push(new Missile(new Vector2(298, 550), 
                         new Vector2(eventData.layerX, eventData.layerY)));
      console.log(eventData);
    };
  };

  var game;
  var start = function() {
    game = new Game();
    canvas.addEventListener("mousedown", game.mouseClick.bind(game));
    game.run();
  };

  return { //missileCommand
    start: start,
  };

})();


$(document).ready(missileCommand.start());
