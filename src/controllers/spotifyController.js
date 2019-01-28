
const util = require('../util/utils');
const querystring = require('query-string');
const redirectURI = process.env.REDIRECT_URI || 'http://localhost:9090/callback';
const clientID = process.env.SPOTIFY_CLIENT_ID || null;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || null;
const stateKey = 'spotify_auth_state';
const service = require('../services/spotifyService');

//User is asked to authorize access with predefined scopes
//User then redirected to 'redirectURI'
const login = (req, res) => {
    let state = util.generateRandomString(16);
    let scope = 'user-read-currently-playing';
    res.cookie(stateKey, state);
    //request auth from spotify's account service
    res.redirect('https://accounts.spotify.com/authorize?' + 
        querystring.stringify({
            response_type: 'code',
            client_id: clientID,
            redirect_uri: redirectURI,
            state: state,
            scope: scope
        }));
};

//User redirected after auth request has been accepted/rejected
//Acquire access/refresh tokens if accepted
const callback = (req, res, tokens) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;
    if (state === null || state !== storedState) {
        res.status(400).json({error: 'state_mismatch'});
    } else {
        res.clearCookie(stateKey);
        let authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectURI
            },
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(clientID + ':' + clientSecret).toString('base64'))
            },
            json: true
        };
        service.requestTokens(authOptions).then((result) => {
            tokens.accessToken = result.accessToken;
            tokens.refreshToken = result.refreshToken;
            tokens.expiresIn = result.expiresIn;
            tokens.startTime = result.startTime;
            res.status(200).end();
        }, (error) =>{
            console.error('Error has occurred during token request', error);
            res.status(400).json(error);
        });
    }
}

const searchSong = async (req, res, tokens) => {
    const elapsedTime = (Date.now() / 1000) - tokens.startTime;
    //Ask for new access token if expired
    if (elapsedTime > tokens.expiresIn) {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64') },
            form: {
                grant_type: 'refresh_token',
                refresh_token: tokens.refreshToken
            },
            json: true
        };
        try {
            tokens.accessToken = await service.requestRefreshToken(authOptions); 
        } catch (err) {
            console.error('Refresh Token Error', err);
            res.status(401).json(err);
        }
    }

    let query = req.query.q;
    let accessToken = tokens.accessToken;
    let refreshToken = tokens.refreshToken;
    if (accessToken && refreshToken && query) {
        let queryParams = {
            url: 'https://api.spotify.com/v1/search',
            qs: {
                q: query,
                type: 'track'
            },
            headers: { 'Authorization' : 'Bearer ' + accessToken },
            json: true
        };

        service.searchSong(queryParams).then((items) => {
            let payload = items.map((item) => {
                let artists = item.artists.map((artist) => {return artist.name});
                return {
                    name: item.name,
                    album_art: item.album.images[1],
                    artists: artists
                };
            });
            res.json(payload);
        }, (err) => {
            console.error('Error searching for song', err);
            res.status(400).json(err);
        });
    } else {
        res.status(400).json({
            error: query ? 'invalid_token' : 'invalid_query'
        })
    }
};

module.exports = { login, callback, searchSong };