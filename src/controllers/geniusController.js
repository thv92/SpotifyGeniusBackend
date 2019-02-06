const geniusService = require('../services/geniusService');
const scrapeService = require('../services/scrapeService');
const searchLyric = (req, res) => {
    const name = req.query.name;
    const artist = req.query.artist;
    if (name && artist) {
        const params = {
            url: 'https://api.genius.com/search',
            headers: { 'Authorization' : 'Bearer ' + process.env.GENIUS_CLIENT_ACCESS_TOKEN },
            qs: {
                q: `${artist} ${name}`
            },
            json: true
        };
        geniusService.requestLyrics(params).then((hits) => {
            console.log(hits);
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
            return found;
        })
        .then((found) => {
            return scrapeService.scrapeLyric({url: found.result.url});
        })
        .then((lyrics) => {
            res.json({lyrics});
        })
        .catch((err) => {
            console.error('Error occurred while requesting lyrics', err);
            res.status(err.status ? err.status : 404).json(err);
        });
    } else {
        res.status(400).json({ error: 'invalid_query' });
    }
};

module.exports = { searchLyric };