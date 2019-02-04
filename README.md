# Spotify Genius Backend

An API wrapper used to request songs from Spotify API and lyrics from the Genius API. 

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

### Environment Variables that are required:
* GENIUS_CLIENT_ACCESS_TOKEN *(Can be generated after Genius API account has been created)*
* SPOTIFY_CLIENT_ID *(One of two required tokens for Spotify API Auth)*
* SPOTIFY_CLIENT_SECRET *(One of two required tokens for Spotify API Auth)*
* REDIRECT_AFTER_CALLBACK *(Where API should redirect to after Auth process is done)*
* MODE *(Development or Production)*

### Prerequisites

```
node 11.4.0

yarn 1.3.0
```

