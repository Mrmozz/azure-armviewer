const express = require('express');
const router = express.Router();
const request = require('request');
const ARMParser = require('../lib/arm-parser');

router
.post('/file', function (req, res, next) {
  // JSON is in file, we hope!
  let templateJSON = req.files.template.data.toString();
  
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
})

module.exports = router;