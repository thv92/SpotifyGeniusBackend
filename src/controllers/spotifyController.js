
const util = require('../util/utils');
const jwt = require('jsonwebtoken');
const querystring = require('query-string');
const redirectURI = process.env.REDIRECT_URI || 'http://localhost:9090/callback';
const clientID = process.env.SPOTIFY_CLIENT_ID || null;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || null;
const stateKey = 'spotify_auth_state';
const service = require('../services/spotifyService');
const jwtCookie = process.env.STATE || 'verify_state';
//User is asked to authorize access with predefined scopes
//User then redirected to 'redirectURI'
const login = (req, res) => {
    console.log('GET ' + req.path);
    console.log('clientID: ' + clientID);
    let state = util.generateRandomString(16);
    let scope = 'user-read-currently-playing';
    res.cookie(stateKey, state);
    res.redirect(process.env.REDIRECT_AFTER_CALLBACK);
    // console.log('Asking user for authentication...');
    // //request auth from spotify's account service
    // res.redirect('https://accounts.spotify.com/authorize?' + 
    //     querystring.stringify({
    //         response_type: 'code',
    //         client_id: clientID,
    //         redirect_uri: redirectURI,
    //         state: state,
    //         scope: scope
    //     }));
};

//User redirected after auth request has been accepted/rejected
//Acquire access/refresh tokens if accepted
//Returns: 0: accessToken | 1: refreshToken | 2: expiresIn | 3: startTime
const callback = (req, res) => {
    console.log('GET ' + req.path);
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;
    const error = req.query.error || null
    if (state === null || state !== storedState) {
        res.status(400).json({error: 'state_mismatch', status: 400});
    } else if (error) {
        res.status(401).json({error: 'user_denied_permission', status: 401});
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
            console.log('Tokens acquired: ');
            console.log(result);
            let payload = {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresIn: result.expiresIn,
                startTime: result.startTime
            };

            let jwtToken = jwt.sign(payload, process.env.JWT_SECRET);
            res.cookie(jwtCookie, jwtToken);
            res.redirect(process.env.REDIRECT_AFTER_CALLBACK);
        }, (error) => {
            console.error('Error has occurred during token request', error);
            res.status(401).json(error);
        });
    }
}

const searchSong = async (req, res) => {
    console.log('GET ' + req.path);
    let query = req.query.q;
    let accessToken = req.user.accessToken;
    let refreshToken = req.user.refreshToken;
    let expiresIn = req.user.expiresIn;
    let startTime = req.user.startTime;
    let elapsedTime = (Date.now() / 1000) - Number.parseInt(startTime);

    if (!expiresIn || !refreshToken || !accessToken || !startTime) {
        console.log('Some Authorization Params were invalid');
        res.status(404).json({
            status: 404,
            message: 'Some Authorization Params were invalid'
        });
    }

    //Ask for new access token if expired
    if (elapsedTime > Number.parseInt(expiresIn)) {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64') },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            },
            json: true
        };
        try {
            accessToken = await service.requestRefreshToken(authOptions); 
        } catch (err) {
            console.error('Refresh Token Error', err);
            res.status(err.status ? err.status : 401).json(err);
        }
    }

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
                    album_art: item.album.images[2],
                    artists: artists
                };
            });
            res.json({results: payload});
        }, (err) => {
            console.error('Error searching for song', err);
            res.status(err.status).json(err);
        });
    } else {
        const statusCode = accessToken && refreshToken ? 400 : 401;
        res.status(statusCode).json({
            error: query ? 'invalid_token' : 'invalid_query',
            status: statusCode
        })
    }
};

module.exports = { login, callback, searchSong };