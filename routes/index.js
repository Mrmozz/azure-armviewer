const express = require('express');
const router = express.Router();

//
// Route for home page
//

router
.get('/', function (req, res, next) {
  res.render('index', 
  { 
    showTools: false
  });
})

module.exports = router;
