var blocks = require('../../shared/blocks');
var createEngine = require('voxel-engine');
var rle = require('../../shared/rle');

var texturePath = 'assets/textures/';
var engine;
var settings;

module.exports = {
  init: function() {
    settings = {
      generate: function(x, y, z) {
        return y === 1 ? 1 : 0
      },
      chunkDistance: 2,
      materials: blocks.getMaterials(),
      texturePath: texturePath,
      worldOrigin: [0, 0, 0],
      controls: { discreteFire: true },
      avatarInitialPosition: [0, 2, 0]
    };
    engine = createEngine(settings);
  },
  getSettings: function() {
    return settings;
  },
  getChunkId: function(chunkPos) {
    return chunkPos.join('|');
  },
  getChunkIdAtPosition: function(pos) {
    return this.getChunkId(engine.voxels.chunkAtPosition(pos));
  },
  getChunk: function(chunkId) {
    return engine.voxels.chunks[chunkId];
  },
  setChunk: function(chunkId, chunk) {
    engine.voxels.chunks[chunkId] = chunk;
  },
  chunkExists: function(chunkId) {
    return !!engine.voxels.chunks[chunkId];
  },
  getExistingChunkIds: function() {
    return Object.keys(engine.voxels.chunks);
  },
  setBlock: function(pos, val) {
    engine.setBlock(pos, val);
  },
  generateChunk: function(chunkId) {
    engine.pendingChunks.push(chunkId);
    engine.loadPendingChunks(engine.pendingChunks.length);
  }
};
