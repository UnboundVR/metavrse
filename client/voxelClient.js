import engine from 'voxel-engine';
import io from 'socket.io-client';
import blocks from '../shared/blocks';
import baseSettings from '../shared/voxelSettings.json';
import extend from 'extend';

function decompress(chunk) { // FIXME repeated
  var voxels = new Array(chunk.dims[0] * chunk.dims[1] * chunk.dims[2]).fill(0);
  chunk.voxels.forEach(function(obj) {
    voxels[obj.i] = obj.v;
  });
  return voxels;
}

export default {
  init() {
    var self = this;
    this.connect();
    return new Promise(resolve => {
      self.onReady = resolve;
    });
  },
  connect() {
    this.socket = io.connect(location.host + '/voxel');
    this.socket.on('disconnect', () => {
      // TODO handle disconnection
    });
    this.bindEvents();
  },
  bindEvents() {
    var self = this;

    var processChunk = chunk => {
      chunk.voxels = decompress(chunk);
      self.engine.showChunk(chunk);
    };

    this.socket.on('init', data => {
      var settings = extend({}, baseSettings, {
        materials: blocks.getMaterials(),
        texturePath: 'assets/textures/',
        controls: { discreteFire: true }
      });
      var chunks = data.chunks;
      settings.generateChunks = false;
      self.engine = self.createEngine(settings);
      chunks.forEach(processChunk);

      self.engine.voxels.on('missingChunk', chunkPosition => {
        self.socket.emit('requestChunk', chunkPosition, (err, chunk) => {
          if(err) {
            alert('Error getting chunk: ', err);
          } else {
            processChunk(chunk);
          }
        });
      });

      self.onReady();
    });

    this.socket.on('set', (pos, val) => {
      self.engine.setBlock(pos, val);
    });
  },
  createEngine(settings) {
    var self = this;
    settings.controlsDisabled = false;
    self.engine = engine(settings);
    self.engine.settings = settings;

    return self.engine;
  },
  setBlock(position, type) {
    this.socket.emit('set', position, type);
  },
  clearBlock(position) {
    this.setBlock(position, 0);
  }
};
