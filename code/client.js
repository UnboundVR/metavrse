// var toolbar = require('toolbar')
var crunch = require('voxel-crunch');
var highlight = require('voxel-highlight');
var skin = require('minecraft-skin');
var player = require('voxel-player');
var io = require('socket.io-client');
var engine = require('voxel-engine');

//var game

module.exports = Client;

function Client(server) {
  if(!(this instanceof Client)) {
    return new Client(server);
  }
  // this.blockSelector = toolbar({el: '#tools'})
  this.playerID;
  this.lastProcessedSeq = 0;
  this.localInputs = [];
  this.connected = false;
  this.currentMaterial = 1;
  this.lerpPercent = 0.1;
  this.server = server;
  this.others = {};
  this.connect(server);
  this.game;
  window.others = this.others;
}

Client.prototype.connect = function(server) {
  var self = this;
  var socket = io.connect(server);
  socket.on('disconnect', function() {
    self.connected = false;
  });
  this.socket = socket;
  this.bindEvents(socket);
};

Client.prototype.bindEvents = function(socket) {
  var self = this;
  this.connected = true;

  socket.on('id', function(id) {
    console.log('got id', id);
    self.playerID = id;
  });

  socket.on('settings', function(settings) {
    settings.generateChunks = false;
    //deserialise the voxel.generator function.
    if (settings.generatorToString != null) {
      settings.generate = eval("(" + settings.generatorToString + ")");
    }
    self.game = self.createGame(settings);
    socket.emit('created');
    socket.on('chunk', function(encoded, chunk) {
      var voxels = crunch.decode(encoded, new Uint32Array(chunk.length)); // doesn't work in browserify, returns all 0s
      chunk.voxels = voxels;
      self.game.showChunk(chunk);
    });
  });

  // fires when server sends us voxel edits
  socket.on('set', function(pos, val) {
    self.game.setBlock(pos, val);
  });
};

Client.prototype.createGame = function(settings) {
  var self = this;
  var socket = this.socket;
  settings.controlsDisabled = false;
  self.game = engine(settings);
  self.game.settings = settings;
  function sendState() {
    if (!self.connected) {
      return;
    }
    var player = self.game.controls.target();
    var state = {
      position: player.yaw.position,
      rotation: {
        y: player.yaw.rotation.y,
        x: player.pitch.rotation.x
      }
    };
    socket.emit('state', state);
  }

  self.game.controls.on('data', function(state) {
    var interacting = false
    Object.keys(state).map(function(control) {
      if (state[control] > 0) interacting = true
    })
    if (interacting) sendState()
  })

  // setTimeout is because three.js seems to throw errors if you add stuff too soon
  setTimeout(function() {
    socket.on('update', function(updates) {
      Object.keys(updates.positions).map(function(player) {
        var update = updates.positions[player]
        if (player === self.playerID) return self.onServerUpdate(update) // local player
        self.updatePlayerPosition(player, update) // other players
      })
    })
  }, 1000)

  socket.on('leave', function(id) {
    if (!self.others[id]) return
    self.game.scene.remove(self.others[id].mesh)
    delete self.others[id]
  })

  return self.game
};

Client.prototype.onServerUpdate = function(update) {
  // todo use server sent location
};

Client.prototype.lerpMe = function(position) {
  var to = new this.game.THREE.Vector3()
  to.copy(position)
  var from = this.game.controls.target().yaw.position
  from.copy(from.lerp(to, this.lerpPercent))
};

Client.prototype.updatePlayerPosition = function(id, update) {
  var pos = update.position
  var player = this.others[id]
  if (!player) {
    var playerSkin = skin(this.game.THREE, 'assets/avatars/player.png', {
      scale: new this.game.THREE.Vector3(0.04, 0.04, 0.04)
    })
    var playerMesh = playerSkin.mesh
    this.others[id] = playerSkin
    playerMesh.children[0].position.y = 10
    this.game.scene.add(playerMesh)
  }
  var playerSkin = this.others[id]
  var playerMesh = playerSkin.mesh
  playerMesh.position.copy(playerMesh.position.lerp(pos, this.lerpPercent))

  // playerMesh.position.y += 17
  playerMesh.children[0].rotation.y = update.rotation.y + (Math.PI / 2)
  playerSkin.head.rotation.z = scale(update.rotation.x, -1.5, 1.5, -0.75, 0.75)
};

function scale( x, fromLow, fromHigh, toLow, toHigh ) {
  return ( x - fromLow ) * ( toHigh - toLow ) / ( fromHigh - fromLow ) + toLow
}
