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


/* GET home page. */
router.get('/', function (req, res, next) {
  let sentence = req.query.sentence
  let words = []
  let numOfWords = sentence.split(' ').length
  sentence.split(' ').forEach((word, index) => {



    Word.findOne({
      where: { name: word }, include: [{
        model: Type
      }]
    }).then(word => {
      console.log('-----------------');
      try {
        console.log(word.dataValues);
        return word.dataValues.types;
      } catch (error) {
        return undefined
      }
      return ;
    }).then(types => {
      words.push({
        name: word,
        types: types
      })
      if (index == numOfWords - 1) {
        res.render('index', {
          sentence: req.query.sentence,
          words: words
        })
      }
    })


  })


})

module.exports = router
