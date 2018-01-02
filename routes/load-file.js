const express = require('express');
const router = express.Router();
const request = require('request');
const ARMParser = require('../lib/arm-parser');
const utils = require('../lib/utils');

//
// Route for loading template from a file upload
//

router
.post('/view', function (req, res, next) {

  // No file :(
  if(!req.files.template) {
    res.render('error', {
      err: "No file specified or uploaded, please supply a file",
      showTools: false
    });
    return; 
  }
  
  // JSON is in file, we hope!
  let templateJSON = req.files.template.data.toString();
  
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
})

module.exports = router;