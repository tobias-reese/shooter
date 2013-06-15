var Game = require('./game').game;
var Deathmatch = function() {
	Game.call(this);
  var v = this.getV();
  var cp = this.getCp();

	var space = this.space;
	space.iterations = 60;
	space.gravity = v(0, -500);
	space.sleepTimeThreshold = 0.5;
	space.collisionSlop = 0.5;

	this.addFloor();
	this.addWalls();

	var width = 50;
	var height = 60;
	var mass = width * height * 1/1000;

  var radius = 20;
  mass = 3;
  var body = space.addBodyServer(new cp.Body(mass, cp.momentForCircle(mass, 0, radius, v(0, 0))));
  body['kind'] = 'circle';
  body['radius'] = radius;
  
  body.setPos(v(200 + 1, (2 * radius + 5) * 1));
  var circle = space.addShape(new cp.CircleShape(body, radius, v(0, 0)));
  circle.setElasticity(0.8);
  circle.setFriction(1);


	var ramp = space.addShape(new cp.SegmentShape(space.staticBody, v(100, 100), v(300, 200), 10));
	ramp.setElasticity(1);
	ramp.setFriction(1);
  ramp['bg'] = 1;

	var middle = space.addShape(new cp.SegmentShape(space.staticBody, v(400, 1000), v(1500, 1100), 10));
	middle.setElasticity(1);
	middle.setFriction(1);
  middle['bg'] = 1;

	var middle2 = space.addShape(new cp.SegmentShape(space.staticBody, v(2000, 1000), v(4000, 1100), 10));
	middle2.setElasticity(1);
	middle2.setFriction(1);
  middle2['bg'] = 1;


	//ramp.setLayers(NOT_GRABABLE_MASK);


};


Deathmatch.prototype = Object.create(Game.prototype);

exports.deathmatch = Deathmatch;
