const escape = require('escape-string-regexp');
const normalize = require('string-normalize-es6');

//For generating cookie value
//Cookie value is then compared to state sent in response body after auth
const generateRandomString = (length) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

//Remove any mix Terminology
const removeMixTerm = (title) => {
    let upper = title.toUpperCase();
    let pattern = /((?:-\s\d*\s*)(?:remaster|master)(?:d|ed|ing)?\s*(?:\d*)?)/ig;

    let separated = upper.split(pattern).map((text) => text.trim());
    if (separated.length > 1) {
        let trimmed = separated.filter((text) => {
            let matched = text.match(pattern);
            if (matched === null || matched.length === 0) return true;
             return false;
        }).join(' ').trim();
        
        console.log('Title Sent To Remove Mix Term: ' + title);
        console.log('Title Removed Mix: ' + trimmed);
    
        return trimmed;
    } else {
        console.log('No Mix Terms could be removed for: ' + title);
        return title;
    }
};

const isArtistVersion = (versionText, artists, featuredArtists) => {
    let isArtist = false;
    if (artists !== null) {
        isArtist = compareArtists(versionText, artists);
    }
    if (featuredArtists !== null) {
        isArtist |= compareArtists(versionText, featuredArtists);
    }
    return isArtist;
};

//Split for remix, feature, reprise, version
const splitTitle = (title) => {
    let splitTitle = title.split(/\s(?=[\(\[]|(?:\-.+(?:version|ver\.\-)))/ig);
    let last = splitTitle.pop().split(/-\s(?!.+\)|\(.+)/g);
    return splitTitle.concat(last);
};

//TODO: forward slash titles => separate them. add isTitleSplit ] boolean
const getSongTitleMetadata = (title, artist) => {
    console.log('=========Creating Song Metadata for: ' + title + '=========');
    title = normalize(title);
    const reprisePat = /((?:\s-\s)?reprise)/ig;
    const featurePat = /\((?:(?:ft|feat)\.|with)(.*)\)/i;
    const featureOfPat = /of\s.+/i;
    const versionPat = /[\-\(]?(.+)(?:version|ver\.)[\)\-]?/i;
    const remixPat = /\((.*)\s?(?:remix(?:ed)?|mix)\)/i;
    const translationPat = /[\(\[].*(?:(translations?|english)).*[\]\)]/i;
    const romanizationPat = /[\(\[]((?:.*romanized?|romanizations?).*)[\]\)]/i;
    const original = title;
    let translationInfo = null;
    let versionInfo = null;
    let featured = null;
    let remixInfo = null;
    let isReprise = false;
    let isFeature = false;
    let isVersion = false;
    let isRemix = false;
    let isTranslation = false;
    let isRomanization = false;
    let titleSeparated = splitTitle(title);
    let shortenedTitle = titleSeparated[0].trim().replace(/\u{02BC}|\u{2019}/ug, '\'');
    const artistsSplit = artist.split(/,\s|&/ig).filter(text => text.length > 0).map(text => text.trim().toUpperCase());
    console.log('Separated Title:');
    console.log(titleSeparated);
    //Match for every feature after splitting
    if (titleSeparated.length > 1) {
        titleSeparated.slice(1).forEach((item) =>{

            //Matching Featured Artists
            let matchItem = item.match(featurePat);
            if (matchItem) {
                if (featured === null) {
                    featured = [];
                }
                let matched = matchItem[1];
                if (matched.match(featureOfPat)) {
                    matched = matched.replace(featureOfPat, '');
                }
                matched = matched.split(/,\s|\s\&\s/ig).map(item => item.trim());
                isFeature = true;
                featured = featured.concat(matched);
                return; //skip to next iteration
            }

            //Matching Versions
            matchItem = item.match(versionPat);
            console.log('Matching Version: ');
            console.log(matchItem);
            if (matchItem) {
                let matched = matchItem[1];
                isVersion = true;
                versionInfo = matched.trim();
                return;
            }

            //Matching reprise
            matchItem = item.match(reprisePat);
            if (matchItem) {
                isReprise = true;
                return;
            }

            //Matching remixes
            matchItem = item.match(remixPat);
            console.log(matchItem);
            if (matchItem) {
               let matched = matchItem[1];
               isRemix = true;
               remixInfo = matched.trim();
               return;
            }

            //Matching translations
            matchItem = item.match(translationPat);
            if (matchItem) {
                translationInfo = matchItem[1].trim();
                isTranslation = true;
                return;
            }

            //Matching Romanization
            matchItem = item.match(romanizationPat);
            if (matchItem) {
                isRomanization = true;
                return;
            }
        });
    }

    const result = {
      isReprise,
      isFeature,
      isRomanization,
      featuredArtists: featured,
      isVersion,
      isArtistVersion: versionInfo === null ? true : isArtistVersion(versionInfo, artistsSplit, featured),
      versionInfo,
      isTranslation,
      translationInfo,
      isRemix,
      remixInfo,
      fullTitle: original,
      title: shortenedTitle,
      artists: artistsSplit
    };

    console.log(result);
    console.log('=========Creating Song Metadata Finished=========');
    return result;
};

const compareArtists = (left, right) => {
    if (left === null && right === null || left === undefined && right === undefined) {
        return true;
    } else if (left === null || right === null) {
        return false;
    }

    if (typeof left === 'string') {
        left = [left];
    }
    if (typeof right === 'string') {
        right = [right];
    }

    //remove spaces and capitalize each item
    let nsLeft = left.map(item => item.replace(/\s/g, '').toUpperCase());
    let nsRight = right.map(item => item.replace(/\s/g, '').toUpperCase());
    return nsLeft.filter((leftItem) => {
        return nsRight.filter(rightItem => rightItem === leftItem).length > 0;
    }).length > 0;
};

const compareTextWithIncludes = (left, right) => {
    if (left === null && right === null) {
        return true;
    } else if (left === null || right === null) {
        return false;
    }
    let shorter = left.length > right.length ? right : left;
    let longer = left.length > right.length ? left : right;
    let regex = new RegExp(escape(shorter), 'ig');
    console.log(`shorter ${shorter} | longer: ${longer}`);
    if (longer.match(regex)) {
        return true;
    }
    return false;
};

const processHitForOtherVersion = (hitMD, url) => {
    if (hitMD.isTranslation) {
       return {
            type: 't',
            typeInfo: hitMD.translationInfo,
            url
        };
    } else {
        return{
            type: 'r',
            typeInfo: 'Romanization',
            url
        };
    }
};


//Google:
//kc:/music/recording_cluster:lyrics
//rGtH5c - ignore
//contains lyrics: Kvw2ac

module.exports = {
    generateRandomString,
    removeMixTerm,
    getSongTitleMetadata,
    compareTextWithIncludes,
    compareArtists,
    processHitForOtherVersion
};