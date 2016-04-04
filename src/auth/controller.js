var githubAuth = require('./githubAuth');

module.exports = {
  getGithubClientInfo: function() {
    return {
      clientId: process.env.GITHUB_CLIENT_ID
    };
  },
  getAccessToken: function(code) {
    return githubAuth.getAccessToken(code).then(function(githubResponse) {
      if(githubResponse.access_token) {
        return githubResponse.access_token;
      } else {
        return Promise.reject(githubResponse.error);
      }
    });
  }
};