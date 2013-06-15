var socket = io.connect('http://192.168.1.75');
var playerId = null;
var currentShapes = null;
var lastBB = {};
var currentStatics = 0;
var Resolution = {'width': 4096, 'height': 3072};
socket.on('news', function (data) {
  playerId = data.playerId;
});

socket.on('game', function(updates) {
  currentUpdate = JSON.parse(updates);
  clientSpace.newUpdate(currentUpdate);
});

socket.on('snapshot', function(snapshot) {
  var currentSnapshot = JSON.parse(snapshot);

  clientSpace.newSnapshot(currentSnapshot);
});

var input = function(action) {
  socket.emit('input', JSON.stringify({'playerId': playerId, 'action': [action]}));
}

var ctx;

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

};
window.innerHeight;
window.innerWidth;

Client.prototype.setPosition = function(position) {
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

//this.offset.x = offset;
//this.offset.y = Resolution.width - position.y;
  this.offsetChange = true;
  client.firstDraw();
}


window.client = new Client();

var drawCircle = function(ctx, scale, point2canvas, c, radius) {
  ctx.strokeStyle = null;
  ctx.fillStyle = '#000000';
	ctx.lineWidth = 0;
	var c = point2canvas(c);
	ctx.beginPath();
	ctx.arc(c.x, c.y, scale * radius, 0, 2*Math.PI, false);
	ctx.fill();
	ctx.stroke();
};

var drawLine = function(ctx, point2canvas, a, b) {
  //console.log('drawLine');
	a = point2canvas(a); b = point2canvas(b);

	ctx.beginPath();
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
};

var drawSegmentShape = function(object, scale, ctx, point2canvas){
	var oldLineWidth = ctx.lineWidth;
	ctx.lineWidth = Math.max(1, object.thickness * scale * 2);
	drawLine(ctx, point2canvas, object.startPosition, object.endPosition);
	ctx.lineWidth = oldLineWidth;

}

var drawCircleShape = function(object, scale, ctx, point2canvas){

  lastBB[object.id] = {'pos': object.position, 'radius': object.radius};
  drawCircle(ctx, scale, point2canvas, object.position, object.radius);
}


var canvas = Client.prototype.canvas = document.getElementById('fg'); //document.getElementsByTagName('canvas')[0];
var canvasBg = Client.prototype.canvasBg = document.getElementById('bg');
var backgroundImage = Client.prototype.backgroundImage = document.getElementById('background'); //document.getElementsByTagName('canvas')[0];


backgroundImage.style.position = canvasBg.style.position = canvas.style.position = "absolute";
backgroundImage.style.top = canvasBg.style.top = canvas.style.top = "0";
backgroundImage.style.left = canvasBg.style.left = canvas.style.left = "0";
backgroundImage.style.width = Resolution.width+'px';
backgroundImage.style.height = Resolution.height+'px';

var ctx = Client.prototype.ctx = canvas.getContext('2d');
Client.prototype.bgctx = canvasBg.getContext('2d');
var backgroundImageContext = backgroundImage.getContext('2d')

var background = new Image();
background.src = "/images/glass.png";

// Make sure the image is loaded first otherwise nothing will draw.
background.onload = function(){
  var ptrn = backgroundImageContext.createPattern(background, 'repeat'); // Create a pattern with this image, and set it to "repeat".
  backgroundImageContext.fillStyle = ptrn;
  backgroundImageContext.fillRect(0, 0, Resolution.width, Resolution.height);
}




// The physics space size is 640x480, with the origin in the bottom left.
// Its really an arbitrary number except for the ratio - everything is done
// in floating point maths anyway.

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

/*
var requestAnimationFrame = window.requestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.oRequestAnimationFrame
	|| window.msRequestAnimationFrame
	|| function(callback) {
		return window.setTimeout(callback, 1000 / 60);
	};
*/
var requestAnimationFrame = function(callback) {
		return window.setTimeout(callback, 1000 / 60);
	};


//draw each similiar item together with one stroke 
//render by color, by thickness
//each moving shape redraw only boundingbox context.fillRect(last.x, last.y, last.width, last.height); not good
//foreground background canvas
/*
Client.prototype.draw = function(shapes) {
  var buffer = document.createElement('canvas');
  buffer.width = this.canvas.width;
  buffer.height = this.canvas.height;
  var bctx = buffer.getContext('2d');

	var ctx = this.ctx;
  var bgctx = this.bgctx;

	var self = this;
  var scale = this.scale;
  var point2canvas = this.point2canvas;

	// Draw shapes
  bctx.strokeStyle = 'black';
	ctx.strokeStyle = 'black';
  bgctx.strokeStyle = 'black';
	//ctx.clearRect(0, 0, this.width, this.height);

	//this.ctx.font = "16px sans-serif";
  //
  // TODO better if we combine it with the next loop
  for(var i=0; i<shapes.length; i++){
    object = shapes[i].data;
    bb = lastBB[object.id];
    if(bb) {
      point = point2canvas(bb.pos);
      if(shapes[i].kind == 'explode') {
        console.log('explode',bb);
      }
      //point = {'x': bb.x, 'y': bb.y};
      ctx.clearRect(point.x-bb.radius*scale-2, point.y-bb.radius*scale-2, bb.radius*2*scale+3, bb.radius*2*scale+3);
      //drawCircle(ctx, scale, point2canvas, point, object.radius, true);
    }
  }

  for(var i=0; i<shapes.length; i++){
    shape = shapes[i];
		//ctx.fillStyle = shape.style();
    var currentCtx = ctx;
    if(shape.bg) {
      currentCtx = bgctx;
      console.log('adding Bg');
    }
    switch(shape.kind) {
      case 'CircleShape':
        drawCircleShape(shape.data, scale, currentCtx, point2canvas);
        break;
      case 'SegmentShape':
        drawSegmentShape(shape.data, scale, currentCtx, point2canvas, shape.bg);
        break;
      default:
        break;
    }
  }
  //ctx.drawImage(buffer, 0, 0);

};
*/
Client.prototype.firstDraw = function() {
  var self = this;

  /*
	var ctx = this.ctx;
	ctx.strokeStyle = 'black';
  this.bgctx.strokeStyle = 'black';
  for(var index in clientSpace.bodies) {
    var body = clientSpace[index];
    lastBB[body.hashid] = {'position': {'x': body.p.x-body.bb_width/2, 'y': body.p.y + body.p.y /2}, 'width': body.bb_width, 'height': body.bb_height}
    body.eachShape(function(shape) {
      shape.draw(ctx, self.scale, self.point2canvas);
    });
  };
  */

  if(self.offsetChange == true) {
    self.bgctx.clearRect(0,0,this.width, this.height);
    self.offsetChange = false;
    self.backgroundImage.style.top = this.offset.y+'px';
    self.backgroundImage.style.left = this.offset.x+'px';
  }

  this.bgctx.strokeStyle = '#000000';
  var staticShapes = clientSpace.space.staticBody.shapeList;
  //console.log('staticShapes',staticShapes);
  //console.log('staticShapes',staticShapes.length);
  for(var i=0; i<staticShapes.length; i++) {
    //console.log('eachonedrawstatic');
    staticShapes[i].draw(self.bgctx, self.scale, self.point2canvas);
  }
}

Client.prototype.draw = function() {
  var self = this;
  var scale = this.scale;

	var ctx = this.ctx;
	ctx.strokeStyle = '#000000';

/*
  for(var index in clientSpace.bodies) {
    var body = clientSpace[index];
    if(body.nodeIdleTime < 0.5) {
      var bodyBB = lastBB[body.hashid];
      if(bodyBB){
        var point = self.point2canvas(bodyBB.position);
        ctx.clearRect(point.x*scale, point.y*scale, bodyBB.bb_width*scale, bodyBB.bb_height*scale);
      }
    }
  };
  */

  ctx.clearRect(0,0,this.width, this.height);

  if(clientSpace.space.staticBody.shapeList.length > currentStatics) {
    currentStatics = clientSpace.space.staticBody.shapeList.length;
    client.firstDraw();

  }

  for(var index in clientSpace.bodies) {
    var body = clientSpace.bodies[index];
    //if(body.nodeIdleTime < 0.5) {
      //lastBB[body.hashid] = {'position': {'x': body.p.x-body.bb_width/2, 'y': body.p.y + body.p.y /2}, 'width': body.bb_width, 'height': body.bb_height}
      body.eachShape(function(shape){
        shape.draw(ctx, self.scale, self.point2canvas);
      });
    //}
  };

}

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

//client simulation
var clientSpace = new clientSpace();
clientSpace.run();
client.firstDraw();

var animation = function(){
  clientSpace.step();
  client.draw();
  /*
  if (currentShapes !== null) {
    client.draw(currentShapes);
    currentShapes = null;
  }
  */
  requestAnimationFrame(animation);
};
animation();

cp.SegmentShape.prototype.draw = function(ctx, scale, point2canvas) {
  //console.log('drawstatic');
	var oldLineWidth = ctx.lineWidth;
	ctx.lineWidth = Math.max(1, this.r * scale * 2);
  //console.log('before draw');
	drawLine(ctx, point2canvas, this.ta, this.tb);
	ctx.lineWidth = oldLineWidth;
};

cp.CircleShape.prototype.draw = function(ctx, scale, point2canvas) {
	drawCircle(ctx, scale, point2canvas, this.tc, this.r);
};


