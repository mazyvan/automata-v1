let express = require('express')
let router = express.Router()
let Sequelize = require('sequelize')

const sequelize = new Sequelize('diccionario', 'diccionario', 'diccionario123', {
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


/** MODEL: Adjetivos */
const Adjetivo = sequelize.define('adjetivos', {
  token: Sequelize.STRING,
  masculino_s: Sequelize.STRING,
  femenino_s: Sequelize.STRING,
  esperanto_s: Sequelize.STRING,
  masculino_p: Sequelize.STRING,
  femenino_p: Sequelize.STRING,
  esperanto_p: Sequelize.STRING
}, { timestamps: false })
/** MODEL: Generos */
const Genero = sequelize.define('generos', {
  genero: Sequelize.STRING,
}, { timestamps: false })
/** MODEL: Nombres */
const Nombre = sequelize.define('nombres', {
  nombre: Sequelize.STRING,
}, { timestamps: false })
/** MODEL: Objetos */
const Objeto = sequelize.define('objetos', {
  token: Sequelize.STRING,
  objeto: Sequelize.STRING,
  esperanto: Sequelize.STRING,
  obj_plural: Sequelize.STRING,
  eo_plural: Sequelize.STRING,
}, { timestamps: false })
/** MODEL: Verbos */
const Verbo = sequelize.define('verbos', {
  infinitivo: Sequelize.STRING,
  esperanto: Sequelize.STRING
}, { timestamps: false })


Nombre.belongsTo(Genero)
Objeto.belongsTo(Genero)




/* GET home page. */
router.get('/', function (req, res, next) {
  let sentence = req.query.sentence
  let words = []
  let numOfWords = sentence.split(' ').length
  sentence.split(' ').forEach((word, index) => {



    Verbo.findOne({ where: { infinitivo: word } }).then(verbo => types = (verbo) ? ['verb_inf'] : undefined)
      .then(types => {
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
