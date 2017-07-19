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
  }
})

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
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
 * ASSOCIATIONS
 */
Word.belongsToMany(Type, { through: 'WordType' })
Type.belongsToMany(Word, { through: 'WordType' })

/**
 * RUN SYNC
 */
sequelize.sync()

/**
 * @param {Object} words 
 * @return {Object} Regresa un objeto de este tipo {start: pos, end: pos}
 */
function getSintagmaVerbalStartEndPositions(words) {
  try {
    if (words[0].types.some(type => type == 'verb')) return { start: 0, end: 1 }
    if (words[0].types.some(type => type == 'negation') && words[1].types.some(type => type == 'verb')) return { start: 0, end: 2 }

  } catch (error) {
    return undefined
  }
}

/**
 * @param {Object} words 
 * @return {Object} Regresa un objeto de este tipo {start: pos, end: pos}
 */
function getSintagmaNominalStartEndPositions(words) {
  try {
    if (words[0].types.some(type => type == 'pronoun')) return { start: 0, end: 1 }
    if (words[0].types.some(type => type == 'propernoun')) return { start: 0, end: 1 }
    if (words[0].types.some(type => type == 'determiner') && words[1].types.some(type => type == 'noun')) return { start: 0, end: 2 }
    // if (words[0].types.some(type => type == 'determiner') && words[1].types.some(type => type == 'verb')) return { start: 0, end: 2 }
    if (words[0].types.some(type => type == 'numeral') && words[1].types.some(type => type == 'noun')) return { start: 0, end: 2 }
    
  } catch (error) {
    return undefined
  }
}

/**
 * @param {String} words 
 * @return Compara y regresa el tipo de oración
 */
function checkSentence(words) {
  if (getSintagmaNominalStartEndPositions(words)) return 'SN'
  if (getSintagmaVerbalStartEndPositions(words)) return 'SV'
}






/* GET home page. */
router.get('/', function (req, res, next) {
  let sentence = req.query.sentence
  let words = []
  let numOfWords = sentence.split(' ').length
  let foundedWords = 0
  sentence.split(' ').forEach((word, index) => {
    Word.findOne({
      where: { name: word }, include: [{ model: Type }]
    }).then(word => {
      if (!word) return
      return word.dataValues.types.map(type => type.name)
    }).then(types => {
      words.push({
        index: index,
        name: word,
        types: types
      })
      foundedWords++
      if (foundedWords == numOfWords) {
        // Ordenamos las palabras
        words.sort(function (a, b) {
          return a.index - b.index;
        })

        // Aquí hay que poner el código necesario para checar los automatas
        // la variable words es un vector de objectos (de palabras)
        // unicamente hay que recorrer cada palabra ejemplo:

        // words.forEach(word => {
        // word.types // types es otro vector así que tambien podemos recorrerlo y comparar
        // })


        let sintagma = checkSentence(words);

        res.render('index', {
          sentence: req.query.sentence,
          words: words,
          sintagma: sintagma
        })
      }
    })
  })
})

module.exports = router
