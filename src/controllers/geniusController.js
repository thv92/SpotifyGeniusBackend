const geniusService = require('../services/geniusService');
const scrapeService = require('../services/scrapeService');
const util = require('../util/utils');

const searchLyric = (req, res) => {
    let name = req.query.name;
    let artist = req.query.artist;
    if (name && artist) {
        name = util.removeMixTerm(name);
        const queryMD = util.getSongTitleMetadata(name, artist);
        const params = {
            url: 'https://api.genius.com/search',
            headers: { 'Authorization' : 'Bearer ' + process.env.GENIUS_CLIENT_ACCESS_TOKEN },
            qs: {
                q: `${artist} ${queryMD.title}`
            },
            json: true
        };
        geniusService.requestLyrics(params).then((hits) => {
            let found = hits.find((hit) => {
                const hitMD = util.getSongTitleMetadata(hit.result.title_with_featured, hit.result.primary_artist.name);
                return util.compareSongTitleMetadata(queryMD, hitMD) || util.compareSongTitleMetadata(queryMD, hitMD, {isFeatured: true, isVersion: true}) || util.compareSongTitleMetadata(queryMD, hitMD, {isFeatured: true, isVersion: true, ignoreArtist: true});
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