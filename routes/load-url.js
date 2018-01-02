const express = require('express');
const router = express.Router();
const request = require('request');
const ARMParser = require('../lib/arm-parser');
const utils = require('../lib/utils');

//
// Route for loading template from a URL (in query string)
//

router
.get('/view', function (req, res, next) {
  let url = req.query.url;
  if(!url) res.redirect('/');

  request.get(url, function (err, armres, body) {
    // Catch most errors
    if(err) { 
      console.log('### Error loading ${url} ${err}');
      res.render('error', {
        err: err,
        showTools: false,
      });
      return; 
    }

    console.log(`### Loaded ${url} ${armres.statusCode} ${armres.statusMessage}`);
    
    // Trap HTTP errors
    if(armres.statusCode > 400) { 
      res.render('error', {
        err: `HTTP ${armres.statusCode} ${armres.statusMessage}, check the URL: ${url}`,
        showTools: false,
      });
      return; 
    }

    // JSON is in body (we hope!)
    let templateJSON = armres.body;
    
    // Parse the template JSON
    var parser = new ARMParser(templateJSON);    

    // Check for errors
    if(parser.getError()) {
      res.render('error', {
        err: parser.getError(),
        showTools: false
      });
      return; 
    }

    // Pass result of parsing to the view
    res.render('main', {
      dataJSON: JSON.stringify(parser.getResult()),
      showTools: true,
      template: utils.encode(templateJSON)
    });
  });
})

module.exports = router;