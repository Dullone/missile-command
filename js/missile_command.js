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

    this.location = function() {
      return new Vector2(this.x, this.y);
    }

  };

  var Explosion = function(location, startRadius, maxRadius, explosionSpeed) {
    this.radius = startRadius || 2;
    this.maxRadius = maxRadius || 20;
    this.location = location;
    this.x = location.x;
    this.y = location.y;
    this.speed = explosionSpeed || 20;
    this.alive = true;

    this.update = function(deltaTime) {
      this.radius += this.speed * deltaTime.seconds;
      if(this.radius > this.maxRadius) {
        this.alive = false;
      }

      //TODO check collision
    };

    this.draw = function(){
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI*2);
      c.closePath();
      c.fillStyle = "red";
      c.fill();
    };

    this.isAlive = function(){
      return this.alive;
    };

    this.hit = function(vector) {
      if(this.location.distance(vector) < this.radius){
        console.log('hit');
        return true;
      } else {
        console.log('not hit')
        return false;
      }
    };

  };

  return { //missileCommand
    Missile: Missile,
    Explosion, Explosion,
  };

})();

var loaded = function(){
  var canvas = document.getElementById('canvas'); 
  var c = canvas.getContext('2d'); 

  var lastUpdate;
  var missl = new missileCommand.Missile(new Vector2(400,550), new Vector2(100,200));
  var explosion = new missileCommand.Explosion(new Vector2(100, 500));

  function loop(){
    window.requestAnimFrame(loop);
    var now = new Date().getTime()
    var time = now - (lastUpdate || now);
    var deltaTime = {time: time, seconds: time/1000 }
    c.fillStyle = "black";
    c.fillRect(0, 0, canvas.width, canvas.height);

    if (missl.isAlive() === true){
      missl.update(deltaTime);
      missl.draw();

    } else {
      missl = new missileCommand.Missile(new Vector2(Math.random() * 450, 550), new Vector2(50,200));
    }
    if (explosion.isAlive() === true){
      explosion.update(deltaTime);
      explosion.draw();
      explosion.hit(missl.location());
    } else {
      explosion = new missileCommand.Explosion(new Vector2(100, 500));
    }

    lastUpdate = now;
  };

  window.requestAnimFrame(loop);
};

$(document).ready(loaded);
