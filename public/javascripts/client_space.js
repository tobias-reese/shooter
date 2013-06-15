(function(window) {
  var player = null;
  var v = cp.v;
  var ClientSpace = function() {
    var space = this.space = new cp.Space();
    space.iterations = 60;
    space.gravity = v(0, -500);
    space.sleepTimeThreshold = 0.5;
    space.collisionSlop = 0.5;
    this['remove_bodies'] = [];
    
    this.bodies = {};
    this.remainder = 0;
  }

  ClientSpace.prototype.newSnapshot = function(snapshot) {
    var bodies = snapshot['bodies'];

    for(var i=0; i<bodies.length; i++) {
      this.addBody(bodies[i]);
    }
  }

  ClientSpace.prototype.newUpdate = function(update) {
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
  ClientSpace.prototype.addBody = function(body) {
    switch(body.kind) {
      case 'circle':
        var object = new cp.Body(1, Infinity);
        object.setPos(body.position);
        object['bb_width'] = 2*body.radius;
        object['bb_height'] = 2*body.radius;
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

  ClientSpace.prototype.createStatic = function(body) {
    var wall = this.space.addShape(new cp.SegmentShape(this.space.staticBody, body.startPosition, body.endPosition, body.thickness));
    wall.setFriction(1);
  }

  ClientSpace.prototype.addPlayer = function(body) {
    var object = new cp.Body(5, Infinity);
    object.setPos(body.position);
    var head = this.space.addShape(new cp.CircleShape(object, 5, v(0, 13)));
    var torso = this.space.addShape(new cp.CircleShape(object, 7, v(0, 1)));
    var legs = this.space.addShape(new cp.CircleShape(object, 7, v(0, -13)));
    player = object;
    this.bodies[body.id] = object;
    object = playerBB(body);
  }

  ClientSpace.prototype.createEnemy = function(body) {
    var object = new cp.Body(1, Infinity);
    object.setPos(body.position);
    this.bodies[body.id] = object;
    var head = this.space.addShape(new cp.CircleShape(object, 5, v(0, 12)));
    var torso = this.space.addShape(new cp.CircleShape(object, 7, v(0, 0)));
    var legs = this.space.addShape(new cp.CircleShape(object, 7, v(0, -14)));
    object = playerBB(body);
  }

  //player has fixed with and height
  var playerBB =function(body) {
    body['bb_width'] = 14;
    body['bb_height'] = 38;
    return body;
  }



  ClientSpace.prototype.moveBody = function(body) {
    if(this.bodies[body.id]) {
      this.bodies[body.id].setPos(body.position);
    }
  }


  var postStepRemoval = function(){
    var space = clientSpace.space;
    var destroyBody = clientSpace.remove_bodies.slice();
    clientSpace.remove_bodies = [];
    while(destroyBody.length) {
      var body = destroyBody.shift();
      while(body.shapeList.length) {
        var shape = body.shapeList.shift();
        space.removeShape(shape);
      }
      //space.removeBody(body); body is not added to the space
    }
  }

  ClientSpace.prototype.destroyBody = function(body) {
    this.remove_bodies.push(clientSpace.bodies[body['id']]);
    //this.space.addPostStepCallback(postStepRemoval);
    postStepRemoval();

    //destroy each shape after step
  }

  ClientSpace.prototype.update = function(dt) {
    this.space.step(dt);

  };

  ClientSpace.prototype.run = function() {
    this.running = true;

    this.lastStep = Date.now();
    this.step();
  };

  ClientSpace.prototype.step = function() {
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

  window.clientSpace = ClientSpace;
})(window);
