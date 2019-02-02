const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrapeLyric: (params) => {
        return new Promise( (resolve, reject) => {
            request.get(params, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const scrapedLyrics = [cheerio.load(body)('div.lyrics p').text()];
                    console.log('Successfully got lyrics to scrape: ');
                    console.log(scrapedLyrics);
                    resolve(scrapedLyrics);
                } else {
                    reject({
                        status: 404,
                        message: "Could not find data to scrape"
                    });
                }
            });
        });
    }
};