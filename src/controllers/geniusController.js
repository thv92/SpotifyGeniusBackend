const geniusService = require('../services/geniusService');
const scrapeService = require('../services/scrapeService');
const searchLyric = async (req, res) => {
    let name = req.query.name;
    let artist = req.query.artist;
    if (name && artist) {
        try {
            let results = await geniusService.doLyrics(name, artist);
            if (results.length === 0) {
                throw ({
                    status: 404,
                    message: 'Lyrics not found'
                });
            }
            //The inside async map function returns list of promises
            //Use promise.all to resolve/wait on them
            let lyrics = await Promise.all(results.map(async (result) => {
                let lyric = await scrapeService.scrapeLyric({url: result.url});
                return {
                    type: result.type,
                    typeInfo: result.typeInfo,
                    lyric
                };
            }));
            res.json({ lyrics });
        } catch(err) {
            console.error('Error occurred while requesting lyrics', JSON.stringify(err));
            res.json({ lyrics: [] });
        }
    } else {
        res.status(400).json({ error: 'invalid_query' });
    }
};

module.exports = { searchLyric };