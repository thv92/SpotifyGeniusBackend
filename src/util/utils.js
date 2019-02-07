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
    let pattern = /((?:-\s*.*)(?:remaster|remix|mix|medley|mash[-\s]?up|master)(?:d|ed|ing)?\s*(?:\d+)?.*)/ig;

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

const getSongTitleMetadata = (title, artist) => {
    console.log('=========Creating Song Metadata for: ' + title + '=========');
    const reprisePat = /(\s-\sreprise)/ig;
    const featuredPat = /\(((?:(?:ft|feat)\.|with).*)\)/i;
    const versionPat = /\(?(?:-)?((?<=[-(])\s?.*version)\)?/i;
    const original = title;
    let version = null;
    let featured = null;
    let isReprised = false;
    let isFeatured = false;
    let isVersion = false;

    if (title.match(reprisePat)) {
        isReprised = true;
        title = title.replace(reprisePat, '');
    }
    let matchedVersion = title.match(versionPat);
    if (matchedVersion) {
        isVersion = true;
        version = matchedVersion[1];
        title = title.replace(versionPat, '');
    }
    let matchedFeat = title.match(featuredPat);
    if (matchedFeat) {
      featured = matchedFeat[1].split(/ft\.|feat\.|,\s?|with/gi).filter(text => text.length > 0).map(text => text.trim());
      isFeatured = true;
      title = title.replace(featuredPat, '');
    }

    //isReprise |
    //isFeatured | boolean
    //featuredArtist
    //isVersion | boolean
    //version: 
    //length
    //full song title
    //primary artist
    //title without featured (take out featured word and parenthesis), version, and reprise
    const result = {
      isReprised,
      isFeatured,
      featuredArtists: featured,
      isVersion,
      version,
      fullTitle: original,
      title: title.split(/\s/).filter(text => text.length > 0).map(text => text.trim()).join(' '),
      artist
    };
    console.log(result);
    console.log('=========Creating Song Metadata Finished=========');
    return result;
};

const compareSongTitleMetadata = (left, right, ignoreFlags = {isReprised: false, isFeatured: false, isVersion: false, ignoreArtist: false}) => {
    if (!ignoreFlags.isReprised && left.isReprised !== right.isReprised) {
        return false;
    }
    if (!ignoreFlags.isFeatured && left.isFeatured !== right.isFeatured) {
        return false;
    } else if (!ignoreFlags.isFeatured && left.isFeatured && right.isFeatured) {
        let notMatching = false;
        left.featuredArtists.forEach((leftFeatured) => {
            let anyMatching = right.featuredArtists.filter(rightFeatured => rightFeatured.toUpperCase() === leftFeatured.toUpperCase()).length > 0;

            if (!anyMatching) {
                notMatching = true;
                return;
            }
        });
        if(notMatching) {
            return !notMatching;
        }
    }
    if (!ignoreFlags.isVersion && left.isVersion !== right.isVersion) {
        return false;
    }

    if (!ignoreFlags.ignoreArtist) {
        let shorterArtist = left.artist.length > right.artist.length ? right.artist : left.artist;
        let longerArtist = left.artist.length > right.artist.length ? left.artist : right.artist;
        let regex = new RegExp(shorterArtist, 'ig');
        if (!longerArtist.match(regex)) {
            return false;
        }
    }

    let shorterTitle = left.title.length > right.title.length ? right.title : left.title;
    let longerTitle = left.title.length > right.title.length ? left.title : right.title;
    let titleRegex = new RegExp(shorterTitle, 'ig');
    if (!longerTitle.match(titleRegex)) {
        return false;
    }
    return true;
};

//Google:
//kc:/music/recording_cluster:lyrics
//rGtH5c - ignore
//contains lyrics: Kvw2ac

module.exports = {
    generateRandomString,
    removeMixTerm,
    getSongTitleMetadata,
    compareSongTitleMetadata
};