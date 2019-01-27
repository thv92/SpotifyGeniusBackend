const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieparser = require('cookie-parser');
const app = express();
const routes = require('./routes/routes');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});

const port = process.env.PORT || 9090;

app.use(cors())
   .use(cookieparser());

//configure routes
routes(app);

console.log('Listening on port: ' + port);
app.listen(port);