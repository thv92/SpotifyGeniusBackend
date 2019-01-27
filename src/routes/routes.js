module.exports = (app) => {
    const querystring = require('query-string');
    const util = require('../util/utils.js');
    const request = require('request');
    const redirectURI = process.env.REDIRECT_URI || 'http://localhost:9090/callback';
    const clientID = process.env.SPOTIFY_CLIENT_ID || null;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || null;
    const stateKey = 'spotify_auth_state';
    let accessToken = null;
    let refreshToken = null;
    let expires = null;

    //User is asked to authorize access with predefined scopes
    //User then redirected to 'redirectURI'
    app.get('/login', (req, res) => {
        let state = util.generateRandomString(16);
        res.cookie(stateKey, state);
        //request auth from spotify's account service
        let scope = 'user-read-private user-read-email';
        res.redirect('https://accounts.spotify.com/authorize?' + 
            querystring.stringify({
                response_type: 'code',
                client_id: clientID,
                redirect_uri: redirectURI,
                state: state,
                scope: scope
            })
        );
    });

    
    //User redirected after auth request has been accepted/rejected
    //Acquire access/refresh tokens if accepted
    app.get('/callback', (req, res) => {
        const code = req.query.code || null;
        const state = req.query.state || null;
        const storedState = req.cookies ? req.cookies[stateKey] : null;
        if ( state === null || state !== storedState) {
            res.status(400).json({
                error: 'state_mismatch'
            });
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
            request.post(authOptions, (error, response, body) => {
                if (!error && response.statusCode === 200 ) {
                    //TODO: REDIRECT TO CLIENT
                    //TODO: REMOVE JSON HERE
                    res.status(200).json({
                        body: body
                    });
                    expires = body.expires_in;
                    accessToken = body.access_token;
                    refreshToken = body.refresh_token;
                } else {
                    res.status(response.statusCode).json({
                        error: body.error,
                        errorDescription: body.error_description
                    });
                }
            });

        }
    });

    //Turn this into function and call whenever refresh is required?
    app.get('/refresh_token', (req, res) => {
        let refreshToken = req.query.refresh_token;
        let authOptions = {
            headers: { 'Authorization': 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64')},
            form: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            },
            json: true
        };

        request.post(authOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                //TODO: Save refreshtoken
                refreshToken = body.refresh_token;
            } else {
                //TODO: add invalid request redirection
                res.redirect('/#', querystring.stringify({
                    error: 'invalid_refresh_request'
                }))
            }
        });
    });

    app.get('/search/song', (req, res) => {
        let query = req.query.q;
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
            request.get(queryParams, (error, response, body) => {
                if ( !error && response.statusCode === 200) {
                    let data = body.tracks.items.map((item) => {
                        let artists = item.artists.map((artist) => {return artist.name});
                        return {
                            name: item.name,
                            album_art: item.album.images[1],
                            artists: artists
                        };
                    });
                    res.json(data);
                    //process data body.tracks.items
                    //items array
                        //item.name (Track Name)
                        //item.album.images => typically 3 sizes | choose best one
                        //item.artists 0 == main, ft. => >0
                } else {
                    res.status(400).json({
                        error: error ? error : 'invalid_request'
                    });
                }
            });
        } else {
            res.status(400).json({
                error: query ? 'invalid_token' : 'invalid_query'
            });
        }
    });

    app.get('/search/lyric', (req, res) => {
        let name = req.query.name;
        let artist = req.query.artist; //primary artist
        console.log(`NAME: ${name} ARTIST: ${artist}`);
        if (name && artist) {
            let params = {
                url: 'https://api.genius.com/search',
                headers: { 'Authorization' : 'Bearer ' + process.env.GENIUS_CLIENT_ACCESS_TOKEN },
                qs: {
                    q: `${name} ${artist}`
                },
                json: true
            };
            //Request lyrics from Genius
            //Filter first 3 and find if title and partial artist match
            request.get(params, (error, response, body) => {
                let lyrics = [];
                if (!error && response.statusCode === 200 && body) {
                    let found = body.response.hits.slice(0, 3).find((hit) => {
                        return hit.result.title.toUpperCase() === name.toUpperCase() &&
                        hit.result.primary_artist.name.toUpperCase().includes(artist.toUpperCase());
                    });
                    if (found) {
                        request.get({url: found.result.url}, (pageError, pageResponse, page)  => {
                            if (!pageError && pageResponse.statusCode === 200) {
                                let cheerio = require('cheerio');
                                let html = cheerio.load(page);
                                //TODO: AWAIT
                                lyrics.push(html('div.lyrics p').text());
                            }
                        });
                    }
                    res.status(200).json({lyrics});
                }
            });
            //get song link via api
            //use python-shell to run python script to scrape lyrics
            //return lyrics array => {}
            //Typically the first hit => check first 3
            //hits => (hit) => {
                //hit.title => verify title to query.name
                //hit.primary_artist.name => verify artist matches at least one
                //hit.url => parse lyrics
            //}

            //if found song => use script to parse lyrics
            //Return lyrics array with objects containing "Original", and other languages if available

        } else {
            res.status(400).json({
                error: 'invalid_artist or invalid_name'
            });
        }


    });
};