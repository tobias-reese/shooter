
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
  , deathmatch = require('./game/deathmatch').deathmatch;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
      layout: false
  });
  
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

console.log("routes: "+routes.index)
app.get('/', routes.index);

app.listen(8081);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


// game
var deathmatch_game = new deathmatch();
deathmatch_game.run();
//deathmatch_game.space.eachShape(function(shape){console.log(shape)});
var networkDelay = 0;
setInterval(function() { 
  deathmatch_game.step();

  networkDelay += 1000/60;
  if(networkDelay > 60) {
    networkDelay = 0;
    sendUpdate();
  }
}, 1000/60);

var sendSnapshot = function() {
  var bodies = deathmatch_game.getBodies();
  //console.log('snapshot', bodies);
  io.sockets.emit('snapshot', JSON.stringify({'bodies': bodies}));
}

var sendUpdate = function() {
  var updates = deathmatch_game.getUpdates();
  if(updates.length) {
    //console.log('>>>>>>>>>>>>>>>>update:',updates);
    io.sockets.emit('game', JSON.stringify({'bodies': updates}));
  }
}


io = io.listen(app, { log: false })
io.sockets.on('connection', function (socket) {
  var playerId = deathmatch_game.newPlayer();
  socket['playerId'] = playerId;
  console.log(playerId);
  socket.emit('news', { 'playerId': playerId });
  socket.on('input', function (data) {
    deathmatch_game.playerInput(JSON.parse(data));
  });
  socket.on('disconnect', function () {
    console.log(socket['playerId']);
    //deathmatch_game.removePlayer(socket['playerId']); doesnt work
  });

  sendSnapshot();
});

