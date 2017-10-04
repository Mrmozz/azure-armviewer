var express = require('express');
var logger = require('morgan');
var app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');
// Set up logging
if (app.get('env') === 'production') {
    app.use(logger('combined'));
  } else {
    app.use(logger('dev'));
}

// Serve static content
app.use('/public', express.static('public'))

// Load in local data
var locals = require('./locals');
app.locals = locals;

// Set up routes
var router = require('./router');
app.use('/', router);

// Start the server, wow!
var port = process.env.PORT || 3000
app.listen(port);
console.log(`### Server listening on port ${port}`);