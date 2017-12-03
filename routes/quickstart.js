const express = require('express');
const router = express.Router();
const request = require('request');

// Index and root
router
.get('/qs', function (req, res, next) {
  request.get('https://github.com/Azure/azure-quickstart-templates', function (err, gitres, body) {
    let githubHtml = gitres.body.toString();
    re = /a href=".*?\/Azure\/azure-quickstart-templates\/tree\/master\/(.*?)"\s+class="js-navigation-open"/g;
    let links = []
    do {
      m = re.exec(githubHtml);
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
  });
})

module.exports = router;
