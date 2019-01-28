const geniusController = require('../controllers/geniusController');
const spotifyController = require('../controllers/spotifyController');

module.exports = (app) => {
    let tokens = {};

    app.get('/login', spotifyController.login);

    app.get('/callback', (req, res) => spotifyController.callback(req, res, tokens));

    app.get('/search/song', (req, res) => spotifyController.searchSong(req, res, tokens));

    app.get('/search/lyric', geniusController.searchLyric);
};