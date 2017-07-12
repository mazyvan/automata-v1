var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function(req, res, next) {
  let sentence = req.query.sentence
  let words = []
  if (sentence) words = sentence.split(' ')
  res.render('index', { 
    sentence: req.query.sentence,
    words: words
  })
})

module.exports = router;
