const request = require('request');
const cheerio = require('cheerio');

module.exports = {
    scrapeLyric: (params) => {
        console.log('Scraping at: ' + params.url);
        return new Promise( (resolve, reject) => {
            request.get(params, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const htmlBody = cheerio.load(body);
                    const scrapedLyrics = htmlBody('div.lyrics p').text();
                    console.log('Successfully got lyrics to scrape');
                    resolve(scrapedLyrics);
                } else {
                    reject({
                        status: 404,
                        message: "Could not find html element to scrape"
                    });
                }
            });
        });
    }
};