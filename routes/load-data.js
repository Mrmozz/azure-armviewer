const express = require('express');
const router = express.Router();
const ARMParser = require('../lib/arm-parser');
const utils = require('../lib/utils');

//
// Route for loading template data via POST, used by the editor only
//

router
.post('/edit', function (req, res, next) {
  // JSON from post data
  let templateJSON = req.body.editor;

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