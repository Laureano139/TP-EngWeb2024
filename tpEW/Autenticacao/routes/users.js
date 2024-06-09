var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
var passport = require('passport')
var userModel = require('../models/user')
var auth = require('../auth/auth')

var User = require('../controllers/users')

router.get('/', auth.acessVerification, function(req, res){
  User.list()
    .then(dados => res.status(200).jsonp({dados: dados}))
    .catch(e => res.status(500).jsonp({error: e}))
})

router.get('/:id', auth.acessVerification, function(req, res){
  User.getUser(req.params.id)
    .then(dados => res.status(200).jsonp({dados: dados}))
    .catch(e => res.status(500).jsonp({error: e}))
})

router.post('/', auth.acessVerification, function(req, res){
  User.addUser(req.body)
    .then(dados => {
      console.log(dados)
      res.status(201).jsonp({dados: dados})
    })
    .catch(e => res.status(500).jsonp({error: e}))
})

router.get('/level/:username', (req,res) =>{
  User.getLevel(req.params.username)
  .then(dados => {
    console.log(dados)
    res.status(201).jsonp({dados: dados})
  })
  .catch(e => {
    console.log("Server error!")
    res.status(500).jsonp({error: e})})
})

router.post('/register', function(req, res) {
  var d = new Date().toISOString().substring(0,19)
  userModel.register(new userModel({ username: req.body.username, name: req.body.name, email:req.body.email,
                filiation: req.body.filiation,level: req.body.level, active: true, creationDate: d }), 
                req.body.password, 
                function(err, user) {
                  if (err) 
                    res.jsonp({error: err, message: "Registration error: " + err})
                  else{
                    passport.authenticate("local")(req,res,function(){
                      jwt.sign({ username: req.user.username, level: req.user.level,
                        sub: 'Mapa das Ruas de Braga EngWeb2024'}, 
                        "MapaDasRuasDeBraga2024",
                        {expiresIn: 3600},
                        function(e, token) {
                          if(e) res.status(500).jsonp({error: "Erro ao gerar o token de sessão: " + e}) 
                          else res.status(201).jsonp({token: token})
                        });
                    })
                  }     
  })
})
  
router.post('/login', passport.authenticate('local'), function(req, res){
  User.getLevel(req.user.username)
    .then(response =>{
      jwt.sign({ username: req.user.username, level: response.level,
        sub: 'Mapa das Ruas de Braga EngWeb2024'}, 
        "MapaDasRuasDeBraga2024",
        {expiresIn: 3600},
        function(e, token) {
          if(e) res.status(500).jsonp({error: "Erro na geração do token: " + e}) 
          else res.status(201).jsonp({token: token})
      });
    })
    .catch(e =>{
        console.log("Ero")
       res.status(507).jsonp({error: e})})
})



router.put('/:id', auth.acessVerification, function(req, res) {
  User.updateUser(req.params.id, req.body)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(e => res.status(506).jsonp({error: e}))
})

router.put('/:id/desativar', auth.acessVerification, function(req, res) {
  User.updateUserStatus(req.params.id, false)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(e => res.status(505).jsonp({error: e}))
})

router.put('/:id/ativar', auth.acessVerification, function(req, res) {
  User.updateUserStatus(req.params.id, true)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(e => res.status(504).jsonp({error: e}))
})

router.put('/:id/password', auth.acessVerification, function(req, res) {
  User.updateUserPassword(req.params.id, req.body)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(e => res.status(503).jsonp({error: e}))
})

router.delete('/:id', auth.acessVerification, function(req, res) {
  User.deleteUser(req.params.id)
    .then(dados => {
      res.jsonp(dados)
    })
    .catch(e => res.status(502).jsonp({error: e}))
})

module.exports = router;