# Spotify Genius Backend

An API wrapper used to request songs from Spotify API and lyrics from the Genius API. It will try to match the song titles acquired from Spotify against the song titles acquired from Genius using regex. 

Through regex, it breaks down each song title + artist into a metadata object that contains information like version, translation, romanizatin, reprise, featured, etc.

The API also uses JWT to send the access information in the form of a token inside of a cookie to the client. The client is required to use the token in its header to request data from the Spotify API.

Deployed on heroku: https://spotify-genius-backend.herokuapp.com/

## Setup

### Development:
```
yarn startDev
```

### Production:
```
yarn start
```


### Routes: 

* /login
* /callback
* /search/song *(queries: q |song query|)*
* /search/lyric *(queries: name |song title|, artist |primary artist name|)*

### Environment Variables that are required:
* GENIUS_CLIENT_ACCESS_TOKEN *(Can be generated after Genius API account has been created)*
* SPOTIFY_CLIENT_ID *(One of two required tok ens for Spotify API Auth)*
* SPOTIFY_CLIENT_SECRET *(One of two required tokens for Spotify API Auth)*
* REDIRECT_AFTER_CALLBACK *(Where API should redirect to after Auth process is done)*
* MODE *(Development or Production)*
* STATE *(Name of cookie sent to client after login)*
* JWT_SECRET *(JWT Secret used to sign jwt)*

### Prerequisites

```
node 11.4.0

yarn 1.3.0
```

