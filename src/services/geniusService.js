const request = require('request');

module.exports = {
    requestLyrics: (queryParams) => {
        return new Promise((resolve, reject) => {
            request.get(queryParams, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    if (!body.response || !body.response.hits) {
                        reject(new Error('No response from genius servers for requested lyrics'));
                    } else {
                        resolve(body.response.hits);
                    }
                } else {
                    reject(new Error(JSON.stringify(error)));
                }
            });
        });
    }
};