var socket = io.connect('http://192.168.1.75');
var playerId = null;
var currentShapes = null;
//var lastBB = {};
var shapeList = {};
var segmentList = {};
var currentStatics = 0;
var lastOffset = {};
var Resolution = {'width': 4096, 'height': 3072};
socket.on('news', function (data) {
  playerId = data.playerId;
});

socket.on('game', function(updates) {
  currentUpdate = JSON.parse(updates);
  client.update(currentUpdate);
});

socket.on('snapshot', function(snapshot) {
  var currentSnapshot = JSON.parse(snapshot);

  client.snapshot(currentSnapshot);
});

var input = function(action) {
  socket.emit('input', JSON.stringify({'playerId': playerId, 'action': [action]}));
}


// Drawing helper methods
var Client = function() {
  var self = this;
  this.offset = {};
  this.offset['x'] = 0;
  this.offset['y'] = 0;
  this.offsetChange = false;
	var canvas2point = this.canvas2point = function(x, y) {
		return v(x / self.scale, Resolution['height'] - y / self.scale);
	};

	this.point2canvas = function(point) {

    return {'x': (point.x + self.offset.x * self.scale), 'y': ((Resolution['height'] - point.y + self.offset.y) * self.scale)};
	};
  this.updatePoint = function(point) {
    var offsetDiff = {'x': this.offset.x - lastOffset.x, 'y': this.offset.y - lastOffset.y};
    return {'x': (point.x + offsetDiff.x), 'y': ((point.y + offsetDiff.y) )};
  };

};


Client.prototype.update = function(elements) {
  var bodies = elements.bodies;
  for(var i = 0; i < bodies.length; i++) {
    var body = bodies[i];
    if(body.playerId == playerId) {
      client.setPosition(body.position);

    }
    switch(body.action) {
      case 'move':
        client.draw(body);
        break;
      case 'new':
        client.draw(body);
        break;
      case 'destroy':
        var shape = shapeList[body.id];
        client.stage.removeChild(shape);
        break;
    }
  }
  client.stage.update();
}

Client.prototype.snapshot = function(currentSnapshot) {
  client.prepareDraw(currentSnapshot)
}

Client.prototype.prepareDraw = function(elements) {
  var bodies = elements.bodies;
  for(var i = 0; i < bodies.length; i++) {
    var body = bodies[i];
    if(body.playerId == playerId) {
      client.setPosition(body.position)
    }
    client.draw(body);
  }
  client.stage.update();


}

Client.prototype.draw = function(body) {
  switch(body.kind) {
    case 'player':
      body.position = {'x': body.position.x-15, 'y': body.position.y + 38}
      var point = this.point2canvas(body.position);
      if(typeof shapeList[body.id] === 'undefined') {

//      var s = new createjs.Shape();
//      var g = s.graphics;
//      client.drawPlayer(g, point, body);
        var s = new createjs.BitmapAnimation(spriteSheet);
        //s.gotoAndPlay("walkLeft");
        s.currentFrame = 0;



        s.x = point.x;
        s.y = point.y;
        shapeList[body.id] = s;
        client.stage.addChild(s);
      }
      else {
        var s = shapeList[body.id];
        console.log(body);
        if(body.air == 0) {
          if(body.direction == 0) {
            if(s.currentAnimation != 'walkLeft') {
              s.gotoAndStop("walkLeft");
            }
          }
          else {
            if(s.currentAnimation != 'walkRight') {
              s.gotoAndStop("walkRight");
            }
          }
        }
        else {
          if(body.direction == 0) {
            if(s.currentAnimation != 'jumpLeft') {
              s.gotoAndStop("jumpLeft");
            }
                
          }
          else {
            if(s.currentAnimation != 'jumpRight') {
              s.gotoAndStop("jumpRight");
            }
          }

        }
        s.x = point.x;
        s.y = point.y;
      }
    break;
    case 'circle':
      var point = this.point2canvas(body.position);
      if(typeof shapeList[body.id] === 'undefined') {
        var s = new createjs.Shape();
        var g = s.graphics;

        //client.drawPlayer(g, point, body);
        drawCircle(g, this.scale, body.radius);
        s.x = point.x;
        s.y = point.y;
        shapeList[body.id] = s;

        client.stage.addChild(s);
      }
      else {
        var segment = shapeList[body.id];
        segment.x = point.x;
        segment.y = point.y;
      }
      break;

    case 'SegmentShape':
      if(typeof segmentList[body.hashid] === 'undefined') {
        var s = new createjs.Shape();
        var g = s.graphics;
        var startPoint = {'x':0, 'y':0};
        var endPoint = {'x': body.endPosition.x - body.startPosition.x, 'y': (-1*(body.endPosition.y - body.startPosition.y))}
        client.drawSegment(g, startPoint, endPoint, body);
        var point = this.point2canvas(body.startPosition);
        s.x = point.x;
        s.y = point.y;
        segmentList[body.hashid] = s;
        client.stage.addChild(s);
      }
  }
}

Client.prototype.updateCam = function() {
  self.backgroundImage.style.top = this.offset.y+'px';
  self.backgroundImage.style.left = this.offset.x+'px';

  for(var key in shapeList) {
   if (shapeList.hasOwnProperty(key)) {
     var shape = shapeList[key];
     var point = this.updatePoint({'x': shape.x, 'y': shape.y});
     shape.x = point.x;
     shape.y = point.y;
     //console.log('now y: '+shape.y)
   }

  }
  
  for (var key in segmentList) {
   if (segmentList.hasOwnProperty(key)) {
      var segment = segmentList[key];
      var point = this.updatePoint({'x': segment.x, 'y': segment.y});
      segment.x = point.x;
      segment.y = point.y;
   }
  }
}

  Client.prototype.drawPlayer = function(g, point, body) {
    var head = {'x': point.x, 'y': point.y};
    var torso = {'x': point.x, 'y': point.y-10};
    var food = {'x': point.x, 'y': point.y-15};
    var shapeX = -5;
    var shapeY = -20;
    var shapeWidth = 10;
    var shapeHeight = 40;
      drawPlayerShape(g, shapeX, shapeY, shapeWidth, shapeHeight)
    drawCircle(g, 1.0, head, 2.0);
    drawCircle(g, 1.0, torso, 5.0);
    drawCircle(g, 1.0, food, 5.0);
  }

Client.prototype.drawSegment = function(g, startPoint, endPoint, body) {
  drawLine(g, startPoint, endPoint)
}

Client.prototype.setPosition = function(position) {
  lastOffset = {'x': this.offset.x, 'y': this.offset.y};
  var offsetX = position.x-window.innerWidth/2;
  var offsetY = Resolution.height - (position.y + window.innerHeight/2);
  if(offsetX > Resolution.width - window.innerWidth) {
    this.offset.x = (Resolution.width - window.innerWidth)*(-1);
  }
  else {
    if(offsetX < 0) {
      offsetX = 0
    }
    else {
      this.offset.x = offsetX * (-1);
    }
  }
  if(offsetY > Resolution.height - window.innerHeight) {
    this.offset.y = (Resolution.height - window.innerHeight)*(-1);
  }
  else {
    if(offsetY < 0) {
      offsetY = 0
    }
    else {
      this.offset.y = offsetY * (-1);
    }
  }
  client.updateCam();

}


window.client = new Client();

var drawCircle = function(g, scale, radius) {
	    g.setStrokeStyle(15, 'round', 'round');
	    g.beginStroke("#000");
	    g.beginFill("#F00");
	    g.drawCircle(0, 0, scale*radius); //55,53
	    g.endFill();
	    g.setStrokeStyle(1, 'round', 'round');
};

var drawPlayerShape = function(g, x, y, w, h) {
	g.setStrokeStyle(15, 'round', 'round');
	g.beginStroke("#000");
	g.beginFill("#F00");
  g.rect(x, y, w, h) 
  g.endFill();
  g.setStrokeStyle(1, 'round', 'round');

  }

var drawLine = function(g, a, b) {
  g.setStrokeStyle(15, 'round', 'round');
  g.beginStroke("#000");
  g.beginFill("#F00");
  g.moveTo(a.x, a.y);
	g.lineTo(b.x, b.y);
  g.closePath();
};

var canvas = Client.prototype.canvas = document.getElementById('fg'); //document.getElementsByTagName('canvas')[0];
var canvasBg = Client.prototype.canvasBg = document.getElementById('bg');
var backgroundImage = Client.prototype.backgroundImage = document.getElementById('background'); //document.getElementsByTagName('canvas')[0];
var imgNinja = new Image();
imgNinja.src = "images/ninjaScale.png";

var spriteSheet = new createjs.SpriteSheet({
    
    images: [imgNinja], 
    // width, height & registration point of each sprite
    frames: {width: 39.5, height: 60, regX: 0, regY: 0}, 
    animations: {    
        walkLeft: [8, 13, "walkLeft"],
        walkRight: [16, 23, "walkRight"],
        jumpLeft: [30, 30, "jumpLeft"],
        jumpRight: [34, 34, "jumpRight"]
    }

});



backgroundImage.style.position = canvasBg.style.position = canvas.style.position = "absolute";
backgroundImage.style.top = canvasBg.style.top = canvas.style.top = "0";
backgroundImage.style.left = canvasBg.style.left = canvas.style.left = "0";
backgroundImage.style.width = Resolution.width+'px';
backgroundImage.style.height = Resolution.height+'px';
backgroundImageContext = backgroundImage.getContext('2d');

var stageBg = new createjs.Stage(canvasBg)
var stage = new createjs.Stage(canvas);
Client.prototype.stage = stage; //canvas.getContext('2d');
Client.prototype.stageBg = stageBg; //canvasBg.getContext('2d');

var background = new Image();
background.src = "/images/glass.png";

// Make sure the image is loaded first otherwise nothing will draw.
background.onload = function(){
  var ptrn = backgroundImageContext.createPattern(background, 'repeat'); // Create a pattern with this image, and set it to "repeat".
  backgroundImageContext.fillStyle = ptrn;
  backgroundImageContext.fillRect(0, 0, Resolution.width, Resolution.height);
}





window.onresize = function(e) {
	var width = canvas.width = canvasBg.width = window.innerWidth;
	var height = canvas.height = canvasBg.height =  window.innerHeight;

  var view = document.getElementById('view');
  view.style.width = window.innerWidth+'px';
  view.style.height = window.innerHeight+'px';
  view.style.overflom = 'hidden';
  Client.prototype.height = Resolution.height;
  Client.prototype.width = Resolution.width;
	if (width/height > Resolution['width']/Resolution['height']) {
		Client.prototype.scale = 1; //height / Resolution['height'];
	} else {
		Client.prototype.scale = 1; //width / Resolution['width'];
	}

	Client.resized = true;
};
window.onresize();



document.onkeypress = function(e) {
  var key = e.charCode || e.keyCode;
  //console.log('keyPress: ' +  e.charCode || e.keyCode);
  if(key === client.controls.left) {
    input(0);
  }
  else if(key === client.controls.right) {
    input(1);
  }
  else if(key === client.controls.up) {
    input(2);
  }
  else if(key === client.controls.shoot) {
    input(3);
  }
  e.preventDefault();

}

document.onkeyup = function(e) {
  //console.log('keyUp:' + e.keyCode);
  if(e.keyCode === client.controls.leftUp || e.keyCode === client.controls.rightUp) {
    input(4);
  }
  e.preventDefault();

}

Client.prototype.controls = {'left': 97, 'right': 100, 'up': 119, 'shoot': 32, 'leftUp': 65, 'rightUp': 68}
//Client.prototype.controls = {'left': 65, 'right': 69, 'up': 44, 'shoot': 32, 'leftUp': 65, 'rightUp': 69}


