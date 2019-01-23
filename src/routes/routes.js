module.exports = (app) => {
    const redirectURI = process.env.REDIRECT_URI || 'http://localhost:9090/callback';
    const client_id = process.env.SPOTIFY_CLIENT_ID || null;
    const client_secret = process.env.SPOTIFY_CLIENT_SECRET || null;
    const stateKey = 'spotify_auth_state';
    const querystring = require('query-string');
    let util = require('../util/utils.js');

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
                client_id: client_id,
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
        const storedState = res.cookies ? res.cookies[stateKey] : null;

        if ( state === null || state !== storedState) {
            //REDIRECT TO 404 STATE
            res.redirect('/#' + querystring.stringify({
                error: 'state_mismatch'
            }));

        } else {
            res.clearCookie(stateKey);
            let authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                form: {
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectURI
                },
                header: {'Authorization' : 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')},
                json: true
            };

            request.post(authOptions, (error, response, body) => {
                if (!error && response.statusCode === 200 ) {

                    //TODO: REDIRECT TO CLIENT
                    res.redirect('/#' + querystring.stringify({
                        access_token: body.access_token,
                        refresh_token: body.refresh_token
                    }));

                } else {
                    res.redirect('/#' + querystring.stringify({
                        error: 'invalid_token'
                    }));
                }
            });

        }
    });

    //Turn this into function and call whenever refresh is required?
    app.get('/refresh_token', (req, res) => {
        let refresh_token = req.query.refresh_token;
        let authOptions = {
            header: { 'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')},
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            json: true
        };

        request.post(authOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                //TODO: Save refreshtoken
                let refreshedToken = body.refresh_token;
            } else {
                //TODO: add invalid request redirection
                res.redirect('/#', querystring.stringify({
                    error: 'invalid_refresh_request'
                }))
            }
        });
    });


    app.get('/song')

};