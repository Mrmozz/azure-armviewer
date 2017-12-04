const express = require('express');
const router = express.Router();
const request = require('request');
const cache = require('memory-cache');

// Fetch list of Azure Quickstart templates from Github page
router
.get('/qs', function (req, res, next) {
  let githubHtml = cache.get('githubHtml');
  
  if(!githubHtml) {
    request.get('https://github.com/Azure/azure-quickstart-templates', function (err, gitres, body) {
      // Cache resulting HTML for 1 hour
      cache.put('githubHtml', gitres.body.toString(), 3600*1000);
      processHtml(gitres.body.toString(), res);
    });
  } else {
    processHtml(githubHtml, res);
  }
})

function processHtml(html, res) {
  re = /a href=".*?\/Azure\/azure-quickstart-templates\/tree\/master\/(.*?)"\s+class="js-navigation-open"/g;
  let links = [];
  do {
    m = re.exec(html);
    if (m) {
      links.push(m[1])
    }
  } while (m);

  // Skip the first three as they are rubbish
  links.splice(0, 3);

  res.render('quickstart', 
  { 
    linkList: links,
    isHome: true
  });
}

module.exports = router;
