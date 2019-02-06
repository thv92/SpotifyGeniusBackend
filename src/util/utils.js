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
    let pattern = /((?:-\s*.*)(?:reprise|remaster|remix|mix|medley|mash[-\s]?up|master)(?:d|ed|ing)?\s*(?:\d+)?)/ig;

    let separated = upper.split(pattern).map((text) => text.trim());

    let trimmed = separated.filter((text) => {
        let matched = text.match(pattern);
        if (matched === null || matched.length === 0) return true;
         return false;
    }).join(' ').trim();
    
    console.log('Title Sent To Remove Mix Term: ' + title);
    console.log('Title Removed Mix: ' + trimmed);

    return trimmed;
};

const getSongTitleMetadata = (title) => {





};



module.exports = {
    generateRandomString,
    removeMixTerm,
    getSongTitleMetadata
};