var gistIds = localStorage.getObject('gistIds');
if(!gistIds) {
  gistIds = {};
  localStorage.setObject('gistIds', gistIds);
}

module.exports = {
  getBlocksWithGists: function() {
    return Object.keys(gistIds).map(function(key) {
      return key.split(',');
    });
  },
  getGistId: function(position) {
    return gistIds[position];
  },
  storeGistId: function(position, gistId) {
    gistIds[position] = gistId;
    localStorage.setObject('gistIds', gistIds);
  }
};
