const path = require('path');
if (process.env.MODE === 'DEVELOPMENT') {
    require('dotenv').config({
        path: path.resolve(__dirname, '../.env')
    });
}

const jwtMiddleware = require('express-jwt');
const express = require('express');
const cors = require('cors');
const cookieparser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 9090;

app.use(cors())
// .use(jwtMiddleware({
    // secret: process.env.JWT_SECRET
// }).unless({path: ['/login', '/callback', '/search/lyric']}))
.use(cookieparser());
//configure routes
const routes = require('./routes/routes');
routes(app);

console.log('Listening on port: ' + port);
app.listen(port);