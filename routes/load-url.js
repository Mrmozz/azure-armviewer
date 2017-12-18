const express = require('express');
const router = express.Router();
const request = require('request');
const ARMParser = require('../lib/arm-parser');
const utils = require('../lib/utils');

router
.get('/view', function (req, res, next) {
  let url = req.query.url;
  if(!url) res.redirect('/');

  request.get(url, function (err, armres, body) {
    if(err) { 
      res.render('error', {
        err: err,
        showTools: false,
      });
      return; 
    }

    // JSON is in body (we hope!)
    let templateJSON = armres.body;
    
    // Parse the template JSON
    var parser = new ARMParser(templateJSON);    

    if(parser.getError()) {
      res.render('error', {
        err: parser.getError(),
        showTools: false
      });
      return; 
    }

    // Pass result of parsing to the view
    res.render('viewer', {
      dataJSON: JSON.stringify(parser.getResult()),
      showTools: true,
      template: utils.encode(templateJSON)
    });
  });
})

module.exports = router;