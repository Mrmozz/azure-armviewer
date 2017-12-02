const express = require('express');
const router = express.Router();
const request = require('request');
const ARMParser = require('../lib/arm-parser');

router
.get('/url/:url', function (req, res, next) {
  let url = req.params.url;

  request.get(url, function (err, armres, body) {
    if(err) { res.status(500).send(`Error fetching remote URL: ${err.message} - ${url}`); return; }
    let templateJSON = armres.body;
    
    // Parse the template JSON
    var parser = new ARMParser(templateJSON);    

    // Pass result of parsing to the view
    res.render('viewer', {
      dataJSON: JSON.stringify(parser.getElements())
    });
  });
})

module.exports = router;