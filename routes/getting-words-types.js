var express = require('express');
var router = express.Router();

const request = require('request');
const fs = require('fs');

console.log();
console.log("Eddy Sanchez's program\n");
console.log("let's get some data about some spanish words");
console.log();

let options = {
  headers: {
    app_id: 'c4d01435',
    app_key: 'd865ea189cf47e5c8cd05d41d2dbc1ec',
    source_lang: 'es'
  }
};

fs.readFile('./most-common-spanish-words-v5.txt', 'utf8', function (err, data) {
  if (err) return console.log(err);

  // Separa el archivo linea por linea
  words = data.split('\n')

  // Recorre cada palabra
  words.forEach((wordInFile, index) => {

    setTimeout(function () {
      options.url = 'https://od-api.oxforddictionaries.com/api/v1/entries/es/' + wordInFile;
      request(options, function (error, response, body) {
        if (error) return;
        try {
          let results = JSON.parse(body).results;

          results.forEach(result => {
            let word = { word: result.word, types: [] };
            result.lexicalEntries.forEach(lexicalEntrie => {
              word.types.push(lexicalEntrie.lexicalCategory);
            })
            fs.appendFile('./words-data.json', JSON.stringify(word, null, 2) + ',', function (err) {
              if (err) throw err;
              console.log('[INFO] SÍ Se encontró la palabra');
            });
          });

        } catch (error) {
          console.log('[WARN] NO Se encontró la palabra');
        }
        if (words.length == index + 1) {

          console.log();
          console.log("The file was successfully created!");
        }

      });
    }, 1000 * index);

  })

});


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index')
});

module.exports = router;
