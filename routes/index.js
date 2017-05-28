var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  // res.render('index', {
  //   title: 'Verium Stats',
  //   stats: req.app.locals.db
  // });
  res.sendFile("index.html", {root: "./"});
});

router.get('/test', (req, res, next) => {
   res.render('index', {
   title: 'Verium Stats',
   stats: req.app.locals.db
  });
});

router.get('/stats.json', (req, res, next) => {
  res.json(req.app.locals.db);
});

module.exports = router;
