(function(window) {
  var player = null;
  var v = cp.v;
  var clientSpace = function() {
    var space = this.space = new cp.Space();
    space.iterations = 60;
    space.gravity = v(0, -500);
    space.sleepTimeThreshold = 0.5;
    space.collisionSlop = 0.5;
    
    this.bodies = {};
    this.remainder = 0;
  }

  clientSpace.prototype.newSnapshot = function(snapshot) {
    var bodies = snapshot['bodies'];

    for(var i=0; i<bodies.length; i++) {
      this.addBody(bodies[i]);
    }
  }

  clientSpace.prototype.newUpdate = function(update) {
    //player.update(update['player']); //position, health, ammo, jetpack
    var bodyUpdates = update['bodies'];
    for(var i=0; i<bodyUpdates.length; i++) {
      switch(bodyUpdates[i].action) {
        case 'move':
          if(bodyUpdates[i].playerId == playerId) {
            client.setPosition(bodyUpdates[i].position)
          }
          this.moveBody(bodyUpdates[i]);
          break;
        case 'new':
          this.addBody(bodyUpdates[i]);
          break;

        case 'destroy':
          this.destroyBody(bodyUpdates[i]);
          break;
      }
    }
    
  }

  //body.kind bullet, big round thing, map should know this elements
  clientSpace.prototype.addBody = function(body) {
    switch(body.kind) {
      case 'circle':
        var object = new cp.Body(1, Infinity);
        object.setPos(body.position);
        object['bb_width'] = 2*body.radius;
        object['bb_height'] = 2*body.radius;
        object['serverId'] = body.id;
        this.bodies[body.id] = object;
        var shape = this.space.addShape(new cp.CircleShape(object, body.radius, v(0, 0)));
        break;
      //case 'player':
        //this.addPlayer(body);
        //break;
      case 'player':
        this.createEnemy(body);
        break;
      case 'SegmentShape':
        this.createStatic(body);
        break;
    }
  }

  clientSpace.prototype.createStatic = function(body) {
    var wall = this.space.addShape(new cp.SegmentShape(this.space.staticBody, body.startPosition, body.endPosition, body.thickness));
    wall.setFriction(1);
  }

  clientSpace.prototype.addPlayer = function(body) {
    var object = new cp.Body(5, Infinity);
    object.setPos(body.position);
    var head = this.space.addShape(new cp.CircleShape(object, 5, v(0, 13)));
    var torso = this.space.addShape(new cp.CircleShape(object, 7, v(0, 1)));
    var legs = this.space.addShape(new cp.CircleShape(object, 7, v(0, -13)));
    player = object;
    this.bodies[body.id] = object;
    object = playerBB(body);
  }

  clientSpace.prototype.createEnemy = function(body) {
    var object = new cp.Body(1, Infinity);
    object.setPos(body.position);
    object['serverId'] = body.id;
    this.bodies[body.id] = object;
    var headShape = new cp.CircleShape(object, 5, v(0, 12));
    var torsoShape = new cp.CircleShape(object, 5, v(0, 12));
    var legShape = new cp.CircleShape(object, 5, v(0, 12));
    headShape['type'] = 'head';
    torsoShape['type'] = 'torso';
    legShape['type'] = 'leg';


    var head = this.space.addShape(headShape);
    var torso = this.space.addShape(torsoShape);
    var legs = this.space.addShape(legShape);
    object = playerBB(body);
  }

  //player has fixed with and height
  var playerBB =function(body) {
    body['bb_width'] = 14;
    body['bb_height'] = 38;
    return body;
  }



  clientSpace.prototype.moveBody = function(body) {
    if(this.bodies[body.id]) {
      this.bodies[body.id].setPos(body.position);
    }
  }

  clientSpace.prototype.destroyBody = function(body) {
    //destroy each shape after step
  }

  clientSpace.prototype.update = function(dt) {
    this.space.step(dt);

  };

  clientSpace.prototype.run = function() {
    this.running = true;

    this.lastStep = Date.now();
    this.step();
  };

  clientSpace.prototype.step = function() {
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

  window.clientSpace = clientSpace;
})(window);
