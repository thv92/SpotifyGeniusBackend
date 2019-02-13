const request = require('request');
const uniqBy = require('lodash.uniqby');
const util = require('../util/utils');

const requestLyricsInfo = (queryParams) => {
    return new Promise((resolve, reject) => {
        request.get(queryParams, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                if (!body.response || !body.response.hits) {
                    reject({
                        "status": 404,
                        "message": "Not found"
                    });
                } else {
                    console.log('Successfully got data from Genius API');
                    resolve(body.response.hits);
                }
            } else {
                if (body.meta) {
                    reject(body.meta);
                } else {
                    reject({
                        "status": 404,
                        "message": "Not found"
                    });
                }
            }
        });
    });
};

const getGeniusQueryParams = (name, artist) => {
    return {
        url: 'https://api.genius.com/search',
        headers: { 'Authorization' : 'Bearer ' + process.env.GENIUS_CLIENT_ACCESS_TOKEN},
        qs: {
            q: `${artist} ${name}`
        },
        json: true
    };
};

const doLyrics = async (name, artist) => {
    console.log('=====START DOLYRICS====');
    let nameRemovedMix = util.removeMixTerm(name);
    let queryMD = util.getSongTitleMetadata(nameRemovedMix, artist);
    let queryParams = getGeniusQueryParams(queryMD.title, artist);
    console.log('GENIUS QUERY PARAMS:');
    console.log(queryParams);
    //requestlyrics => return hits
    //for each hit: compare title and artist + featured and store for matches and reprise. Also match for artist: genius romanization and genius translations
    let result = [];
    try {
        let otherVersions = [];
        let mainVersion = [];
        let possibleMainVersions = [];
        let hits = await requestLyricsInfo(queryParams);
        hits.forEach(hit => {
            let hitMD = util.getSongTitleMetadata(hit.result.title_with_featured, hit.result.primary_artist.name);
            if (util.compareTextWithIncludes(queryMD.title, hitMD.fullTitle) && queryMD.isReprise === hitMD.isReprise) {
                console.log('Title and Reprise matched!');

                if ((hitMD.versionInfo === queryMD.versionInfo || hitMD.isASSLV) && (hitMD.isTranslation || hitMD.isRomanization) && (util.compareTextWithIncludes(queryMD.artists[0], hitMD.title) || util.compareTextWithIncludes(queryMD.title, hitMD.title))) {
                    otherVersions.push(util.processHitForOtherVersion(hitMD, hit.result.url));
                    return;
                }

                //Concat featured artist with artist to do a sort of includes from the query's MD since it's only providing the primary artist + featured. 
                //Can then compare towards a more detailed list from genius's data
                let concatQueryArtists = queryMD.featuredArtists === null ? queryMD.artists : queryMD.artists.concat(queryMD.featuredArtists);
                let concatHitArtists = hitMD.featuredArtists === null ? hitMD.artists : hitMD.artists.concat(hitMD.featuredArtists);
                
                if (util.compareArtists(concatQueryArtists, concatHitArtists) && queryMD.isArtistVersion === hitMD.isArtistVersion) {
                    if (queryMD.isRemix === hitMD.isRemix && queryMD.remixInfo === hitMD.remixInfo && queryMD.versionInfo === hitMD.versionInfo) {
                        mainVersion.push(hit);
                    } else {
                        possibleMainVersions.push(hit);
                    }
                }
            }
        });

        //This happens when there are remixes and you can't find any remixed versions
        //Should get the original version
        if (mainVersion.length === 0 && possibleMainVersions.length > 0) {
            mainVersion = possibleMainVersions;
        }

        let result = [];
        if (mainVersion.length > 0) {
            result.push({
                type: 'o',
                typeInfo: 'Original',
                url: mainVersion[0].result.url
            });
        }

        if (otherVersions.length > 0) {
            //Remove any duplicates
            otherVersions = uniqBy(otherVersions, item => item.typeInfo);
            result = result.concat(otherVersions);
        }

        result.sort((left, right) => {
            if (left.type > right.type) {
                return 1;
            } else if (left.type === right.type) {
                return 0;
            } else {
                return -1;
            }
        });

        console.log('OTHERVERSION: ');
        console.log(otherVersions);
        console.log('MAINVERSION: ');
        console.log(mainVersion);
        console.log('POSSIBLEMAINVERSIONS: ');
        console.log(possibleMainVersions);
        console.log('RESULT: ');
        console.log(result);
        console.log('=====END DOLYRICS====');
        return  result;
    } catch (err) {
        return result;
    }
};

module.exports = {
    requestLyricsInfo,
    doLyrics,
    getGeniusQueryParams

};