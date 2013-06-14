var cp = require('chipmunk');
var Player = require('./Player').Player;
var v = cp.v;
var newBodies = [];
var currentId = 1;

var ctx;


var GRABABLE_MASK_BIT = 1<<31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

var BodyEnum = {'world': 0, 'bullet': 1, 'player_head': 2, 'player_body': 3};
var Resolution = {'width': 1024, 'height': 768};
var explodeShape = [];

var Game = function() {
  this.remainder = 0;
	var space = this.space = new cp.Space();
  space['remove_bodies'] = [];
  space['remove_shapes'] = [];

  var postStepRemoval = function(){
    while(space['remove_shapes'].length) {
      var shape = space['remove_shapes'].shift();
      space.removeShape(shape);
      explodeShape.push(shape.hashid);
    }
    while(space['remove_bodies'].length) {
      var body = space['remove_bodies'].shift();
      while(body.shapeList.length) {
        var shape = body.shapeList.shift();
        explodeShape.push(shape.hashid);
        space.removeShape(shape);
      }
      space.removeBody(body);
    }
  }


  cp.Space.prototype.removeBodyNS = function(body) {
    if(!body['removed']) {
      body['removed'] = true;
      this['remove_bodies'].push(body);
    }
  }

  space.addCollisionHandler(BodyEnum.world, BodyEnum.bullet, null, null, function(e){space.removeBodyNS(e.body_b)}, null);
  space.addCollisionHandler(BodyEnum.bullet, BodyEnum.world, null, null, function(e){space.removeBodyNS(e.body_a)}, null);
  space.postStepCallbacks.push(postStepRemoval);
	var self = this;

};

/*
Game.prototype.getShapes = function() {

  var shapes = [];
  this.space.eachShape(function(shape){
    shapes.push(shape.draw());
  });
  return shapes;
}


Game.prototype.getDifferences = function() {

  var shapes = [];
  this.space.eachBody(function(body){
    if(body.nodeIdleTime < 0.5) {
      body.eachShape(function(shape){
        shapes.push(shape.draw());
      });
    }
  });
  while(explodeShape.length) {
    var eshape = explodeShape.shift();
    var data = {'kind': 'explode', 'data': {'id': eshape}};
    shapes.push(data);
    
    console.log('shapes: ',data);
  }
  return shapes;
}

*/

Game.prototype.getBodies = function() {
  var bodies = [];

  this.space.eachBody(function(body) { 
    var bodyDraw = body.draw('new');
    if(bodyDraw.id) {
      bodies.push(bodyDraw);
    }
  });

  staticShapes = this.space.staticBody.shapeList;
  for(var i=0; i<staticShapes.length; i++) {
    var bodyDraw = staticShapes[i].draw();
    if(bodyDraw) {
      bodies.push(bodyDraw);
    }
  }
  
  return bodies;
}

Game.prototype.getUpdates = function() {
  var bodies = [];
  this.space.eachBody(function(body){
    if(body.nodeIdleTime < 0.5) {
      var bodyDraw = body.draw('move');
      if(bodyDraw.id) {
        bodies.push(bodyDraw);
      }
    }
  });
  for(var i=0; i<newBodies.length; i++) {
    var body = newBodies[i];
    var bodyDraw = body.draw('new');
    if(bodyDraw.id) {
      bodies.push(bodyDraw);
    }
  }
  newBodies = [];

  return bodies;
}

Game.prototype.playerList = {};
// The physics space size is 640x480, with the origin in the bottom left.
// Its really an arbitrary number except for the ratio - everything is done
// in floating point maths anyway.

// These should be overridden by the demo itself.
Game.prototype.update = function(dt) {
	this.space.step(dt);

};

Game.prototype.getCp = function(){return cp};
Game.prototype.getV = function(){return v};


Game.prototype.run = function() {
	this.running = true;

	var self = this;
	var step = function() {
		self.step();
	};

	this.lastStep = Date.now();
	step();
};

Game.prototype.step = function() {
	var now = Date.now();
	var dt = (now - this.lastStep) / 1000;
	this.lastStep = now;

	var lastNumActiveShapes = this.space.activeShapes.count;

	// Limit the amount of time thats passed to 0.1 - if the user switches tabs or
	// has a slow computer, we'll just slow the simulation down.
	dt = Math.min(dt, 1/25);

	this.remainder += dt;

	while(this.remainder > 1/60) {
		// Chipmunk works better with a constant framerate, because it can cache some results.
		this.remainder -= 1/60;
		this.update(1/60);
	}

};

Game.prototype.addFloor = function() {
	var space = this.space;
	var floor = space.addShape(new cp.SegmentShape(space.staticBody, v(0, 0), v(640, 0), 5));
	floor.setElasticity(1);
	floor.setFriction(1);
	floor.setLayers(NOT_GRABABLE_MASK);
  floor['bg'] = 1;

  //roof
  var space = this.space;
	var roof = space.addShape(new cp.SegmentShape(space.staticBody, v(0, 480), v(640, 480), 5));
	roof.setElasticity(1);
	roof.setFriction(1);
	roof.setLayers(NOT_GRABABLE_MASK);
  roof['bg'] = 1;
};

Game.prototype.addWalls = function() {
	var space = this.space;
	var wall1 = space.addShape(new cp.SegmentShape(space.staticBody, v(0, 0), v(0, 480), 5));
	//wall1.setElasticity(1);
	wall1.setFriction(1);
	wall1.setLayers(NOT_GRABABLE_MASK);
  wall1['bg'] = 1;

	var wall2 = space.addShape(new cp.SegmentShape(space.staticBody, v(640, 0), v(640, 480), 5));
	//wall2.setElasticity(1);
	wall2.setFriction(1);
	wall2.setLayers(NOT_GRABABLE_MASK);
  wall2['bg'] = 1;
};

//my stuff
// input = {'playerId': 111, 'action': [1, 2]}
// player_action = {'left': 0, 'right': 1, 'jump': 3, 'shoot': 4}

Game.prototype.newPlayer = function() {
  var player = new Player(v(100,100), this.space);
  this.playerList[player.id] = player;
  return player.id;
}

Game.prototype.playerInput = function(input) {
  player = this.playerList[input.playerId];

  if(player.health < 1) {
    return
  }

  for(var i=0; i < input.action.length; i++) {
    action = input.action[i];
    if(action >= 0 && action <= 2) {
      player.move(action);
    }
    else if(action === 3) {
      player.shoot();
    }
    else if(action == 4) {
      player.keyup();
    }
  }

}

cp.Body.prototype.draw = function(action) {
  body = null;

  switch(this.kind) {
    case 'player':
      body = {'kind': 'player', 'position': this.p, 'action': action, 'id': this.id};
      break;
    case 'circle':
      body = {'kind': 'circle', 'position': this.p, 'radius': this.radius, 'action': action, 'id': this.id};
      break;
  }


  return body;
}

cp.Space.prototype.addBodyServer = function(body) {
  body['id'] = currentId++;
  newBodies.push(body);
  return this.addBody(body);

}

cp.PolyShape.prototype.draw = function()
{
  /*
	ctx.beginPath();

	var verts = this.tVerts;
	var len = verts.length;
	var lastPoint = point2canvas(new cp.Vect(verts[len - 2], verts[len - 1]));
	ctx.moveTo(lastPoint.x, lastPoint.y);

	for(var i = 0; i < len; i+=2){
		var p = point2canvas(new cp.Vect(verts[i], verts[i+1]));
		ctx.lineTo(p.x, p.y);
	}
	ctx.fill();
	ctx.stroke();
  */
  return {'kind': 'PolyShape', 'data': 'null'}
};

cp.SegmentShape.prototype.draw = function() {
  var data = {'kind': 'SegmentShape', 'startPosition': this.ta, 'endPosition': this.tb, 'thickness': this.r};
  if(this.bg) {
    data['bg'] = 1;
  }
  return data;
};

cp.CircleShape.prototype.draw = function() {
  var data = {'kind': 'CircleShape', 'data': {'id': this.hashid, 'position': this.tc, 'radius': this.r}};
  if(this.bg) {
    data['bg'] = 1;
  }
  return data;
};



exports.game = Game;
