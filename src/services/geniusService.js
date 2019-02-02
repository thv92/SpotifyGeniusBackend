const request = require('request');

module.exports = {
    requestLyrics: (queryParams) => {
        return new Promise((resolve, reject) => {
            request.get(queryParams, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    if (!body.response || !body.response.hits) {
                        reject({
                            "status": 404,
                            "message": "Not found"
                        });
                    } else {
                        console.log('Successfully got data from Genius API');
                        resolve(body.response.hits);
                    }
                } else {
                    if (body.meta) {
                        reject(body.meta);
                    } else {
                        reject({
                            "status": 404,
                            "message": "Not found"
                        });
                    }
                }
            });
        });
    }
};