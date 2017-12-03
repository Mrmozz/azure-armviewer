const express = require('express');
const router = express.Router();
const request = require('request');
const ARMParser = require('../lib/arm-parser');

router
.get('/url', function (req, res, next) {
  res.redirect('/');
})

.get('/url/:url', function (req, res, next) {
  let url = req.params.url;

  request.get(url, function (err, armres, body) {
    if(err) { 
      res.render('error', {
        err: err
      });
      return; 
    }

    // JSON is in body (we hope!)
    let templateJSON = armres.body;
    
    // Parse the template JSON
    var parser = new ARMParser(templateJSON);    

    if(parser.getError()) {
      res.render('error', {
        err: parser.getError()
      });
      return; 
    }

    // Pass result of parsing to the view
    res.render('viewer', {
      dataJSON: JSON.stringify(parser.getElements()),
      isHome: false
    });
  });
})

module.exports = router;