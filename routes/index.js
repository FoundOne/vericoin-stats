var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Verium Stats',
    stats: req.app.locals.db
  });
});

module.exports = router;
