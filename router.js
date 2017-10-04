const express = require('express');
const router = express.Router();

// Get home page and index
router.get('/', function (req, res, next) {
   res.render('index', 
   { 
     title: 'Home'
   });
});

// Get about page
router.get('/about', function (req, res, next) {
   res.render('about', 
   { 
     title: 'About'
   });
});

module.exports = router;