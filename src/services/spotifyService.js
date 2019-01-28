const request = require('request');

module.exports = {
    requestTokens: (authOptions) => {
        return new Promise((resolve, reject) => {
            request.post(authOptions, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve({
                        expiresIn: body.expires_in,
                        accessToken: body.access_token,
                        refreshToken: body.refresh_token,
                        startTime: new Date().now()/1000
                    });
                } else {
                    reject({
                        error: body.error,
                        errorDescription: body.error_description
                    });
                }
            });
        });
    },
    requestRefreshToken: (authOptions) => {
        return new Promise((resolve, reject) => {
            request.post(authOptions, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve(body.refresh_token);
                } else {
                    reject({ error: 'invalid_refresh_request' });
                }
            });
        });
    },
    searchSong: (queryParams) => {
        return new Promise((resolve, reject) => {
            request.get(queryParams, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve(body.tracks.items);
                } else {
                    reject({ error: error ? error : 'invalid_request'});
                }
            });
        });
    }
};