let express = require('express')
let router = express.Router()
let Sequelize = require('sequelize')

const sequelize = new Sequelize('uni_automata', 'uni_automata', 'uni_automata123', {
  host: 'localhost',
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  logging: false
})

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.\n')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
    process.exit(1);
  })


/** 
 * MODEL: WORDS 
 */
const Word = sequelize.define('word', {
  name: {
    type: Sequelize.STRING(30),
    primaryKey: true
  },
  number: Sequelize.BOOLEAN,
  gender: Sequelize.BOOLEAN,
})

/** 
 * MODEL: TYPES
 */
const Type = sequelize.define('type', {
  name: Sequelize.STRING(15),
})

/**
 * DEFINE ASSOCIATIONS
 */
Word.belongsToMany(Type, { through: 'WordType' })
Type.belongsToMany(Word, { through: 'WordType' })

/**
 * RUN SYNC
 */
sequelize.sync()

/**
 * @param {Object} sentence 
 * @param {Object} startAt 
 * @return {Object} Regresa un objeto de este tipo {start: pos, end: pos}
 */
function getSintagmaVerbalStartEndPositions(sentence, startAt = 0) {
  if (!sentence[startAt].hasData()) return
  if (sentence[startAt].types.some(type => type == 'verb')) return { start: startAt, end: startAt + 1 }

  if (!sentence[startAt + 1] || !sentence[startAt + 1].hasData()) return
  if (sentence[startAt].types.some(type => type == 'negation') && sentence[startAt + 1].types.some(type => type == 'verb')) return { start: startAt, end: startAt + 2 }

}

/**
 * @param {Object} sentence
 * @param {Object} startAt 
 * @return {Object} Regresa un objeto de este tipo {start: pos, end: pos}
 */
function getSintagmaNominalStartEndPositions(sentence, startAt = 0) {
  if (!sentence[startAt].hasData()) return
  if (sentence[startAt].types.some(type => type == 'pronoun')) return { start: startAt, end: startAt + 1 }
  if (sentence[startAt].types.some(type => type == 'propernoun')) return { start: startAt, end: startAt + 1 }

  if (!sentence[startAt + 1] || !sentence[startAt + 1].hasData()) return
  if (
    (sentence[startAt].types.some(type => type == 'determiner')) &&
    (sentence[startAt + 1].types.some(type => type == 'noun')) &&
    (sentence[startAt].isSingular() == sentence[startAt + 1].isSingular()) &&
    (sentence[startAt].isMasculine() == sentence[startAt + 1].isMasculine())
  ) {
    return { start: startAt, end: startAt + 2 }
  }
  if (
    (sentence[startAt].types.some(type => type == 'numeral')) &&
    (sentence[startAt + 1].types.some(type => type == 'noun')) &&
    (sentence[startAt].isSingular() == sentence[startAt + 1].isSingular()) &&
    (sentence[startAt].isMasculine() == sentence[startAt + 1].isMasculine())
  ) {
    return { start: startAt, end: startAt + 2 }
  }
}

/**
 * @param {String} sentence 
 * @return Compara y regresa un array de sintagmas
 */
function checkSentence(sentence, lastCheckedPosition = 0, detectedPartsOfSentence = []) {
  if (result = getSintagmaNominalStartEndPositions(sentence, lastCheckedPosition)) {
    detectedPartsOfSentence.push('SN')
    lastCheckedPosition = result.end
    // console.log('last checked pos SN', sentence, lastCheckedPosition, detectedPartsOfSentence);

  } else if (result = getSintagmaVerbalStartEndPositions(sentence, lastCheckedPosition)) {
    detectedPartsOfSentence.push('SV')
    lastCheckedPosition = result.end
    // console.log('last checked pos SV', sentence, lastCheckedPosition, detectedPartsOfSentence);

  } else {
    // console.log('entro en else');
    return detectedPartsOfSentence
  }

  if (sentence.length > lastCheckedPosition) {
    // console.log('entro en condicion');
    return checkSentence(sentence, lastCheckedPosition, detectedPartsOfSentence)
    // console.log(detectedPartsOfSentence);

  } else {
    // console.log('entro en else de condicion');
    // console.log(detectedPartsOfSentence);
    return detectedPartsOfSentence
  }

}






/* GET home page. */
router.get('/', function (req, res, next) {
  let sentence = req.query.sentence
  let words = []
  if (!sentence) return res.render('index')
  let numOfWords = sentence.split(' ').length
  let foundedWords = 0
  sentence.split(' ').forEach((word, index) => {
    Word.findOne({
      where: Sequelize.or(
        { name: word },
        { name: word.charAt(0).toUpperCase() + word.slice(1) }
      ), include: [{ model: Type }]
    }).then(result => {
      words.push({
        index: index,
        name: word,
        hasData: () => (result) ? true : false,

        isPlural: () => (result) ? (result.dataValues.number == null) | result.dataValues.number : undefined,
        isSingular: () => (result) ? (result.dataValues.number == null) | !result.dataValues.number : undefined,

        isMasculine: () => (result) ? (result.dataValues.gender == null) | result.dataValues.gender : undefined,
        isFeminine: () => (result) ? (result.dataValues.gender == null) | !result.dataValues.gender : undefined,

        number: (result) ? result.dataValues.number : undefined,
        gender: (result) ? result.dataValues.gender : undefined,
        types: (result) ? result.dataValues.types.map(type => type.name) : undefined
      })
      foundedWords++
      if (foundedWords == numOfWords) {
        // Ordenamos las palabras
        words.sort((a, b) => a.index - b.index)

        // Aquí hay que poner el código necesario para checar los automatas
        // la variable words es un vector de objectos (de palabras)
        // unicamente hay que recorrer cada palabra ejemplo:

        // words.forEach(word => {
        // word.types // types es otro vector así que tambien podemos recorrerlo y comparar
        // })
        console.log();
        console.log('WORDS DATA FOUND:');
        console.log(JSON.stringify(words, null, 2));

        let sintagmas = checkSentence(words);

        res.render('index', {
          sentence: req.query.sentence,
          words: words,
          sintagmas: sintagmas
        })
      }
    })
  })
})

module.exports = router
