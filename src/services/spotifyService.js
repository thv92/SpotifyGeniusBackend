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
                        startTime: (Date.now() / 1000)
                    });
                } else {
                    reject({
                        error: body.error,
                        errorDescription: body.error_description,
                    });
                }
            });
        });
    },
    requestRefreshToken: (authOptions) => {
        return new Promise((resolve, reject) => {
            request.post(authOptions, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    console.log('Successfully refreshed token');
                    resolve(body.access_token);
                } else {
                    reject({ error: body.error, errorDescription: body.error_description });
                }
            });
        });
    },
    searchSong: (queryParams) => {
        return new Promise((resolve, reject) => {
            request.get(queryParams, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    console.log('Successfully retrieved songs from Spotify API');
                    resolve(body.tracks.items);
                } else {
                    console.log(error, response, body);
                    reject({ error: body.error.message, status: body.error.status});
                }
            });
        });
    }
};