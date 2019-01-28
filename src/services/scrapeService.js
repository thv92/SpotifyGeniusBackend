const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrapeLyric: (params) => {
        return new Promise( (req, res) => {
            request.get(params, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve(cheerio.load(body)('div.lyrics p').text());
                } else {
                    reject(new Error('Could not scrape lyrics with cheerio'));
                }
            });
        });
    }
};