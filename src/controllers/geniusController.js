const geniusService = require('../services/geniusService');
const scrapeService = require('../services/scrapeService');
const util = require('../util/utils');

const searchLyric = (req, res) => {
    let name = req.query.name;
    let artist = req.query.artist;
    if (name && artist) {
        name = util.removeMixTerm(name);


        const params = {
            url: 'https://api.genius.com/search',
            headers: { 'Authorization' : 'Bearer ' + process.env.GENIUS_CLIENT_ACCESS_TOKEN },
            qs: {
                q: `${artist} ${name}`
            },
            json: true
        };
        geniusService.requestLyrics(params).then((hits) => {
            let found = hits.find((hit) => {
                const hitTitle = hit.result.title;
                const longerTitle = hitTitle.length > name.length ? hitTitle : name;
                const shorterTitle = hitTitle.length > name.length ? name : hitTitle;
                console.log('LONG TITLE: ' + longerTitle);
                console.log('SHORT TITLE: ' + shorterTitle);
                console.log('HIT SEARCHING: ');
                console.log(hit);
                return longerTitle.toUpperCase().includes(shorterTitle.toUpperCase())
                    && hit.result.primary_artist.name.toUpperCase().includes(artist.toUpperCase());
            });

            if (!found) {
                throw ({
                    status: 404,
                    message: "Lyric not found"
                });
            }
            return found;
        })
        .then((found) => {
            return scrapeService.scrapeLyric({url: found.result.url});
        })
        .then((lyrics) => {
            res.json({lyrics});
        })
        .catch((err) => {
            console.error('Error occurred while requesting lyrics', JSON.stringify(err));
            res.status(err.status ? err.status : 404).json(err);
        });
    } else {
        res.status(400).json({ error: 'invalid_query' });
    }
};

module.exports = { searchLyric };