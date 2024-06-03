var express = require('express');
var router = express.Router();
var axios = require('axios');
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas/')
  .then(resp => {
    var ruas = resp.data;
    res.status(200).render('index', { "Ruas": ruas, "Data": date });
  })
  .catch(error => {
    res.status(500).render('error', { "error": error });
  });
});

// This function will be called if authentication was successful.
router.post('/login', passport.authenticate('local'), function(req, res) {
  res.redirect('/protegida');
});

function verificaAutenticacao(req, res, next){
  console.log("User (verif.): " + JSON.stringify(req.user))
  if(req.isAuthenticated()){
    next();
  }
  else{
    res.redirect('/login');
  }
}

router.get('/protegida', verificaAutenticacao, (req,res) => {
  res.send("Atingiste a área protegida!!!" + "User: " + JSON.stringify(req.user));
});

router.get('/delete/:id', function(req, res, next) {
  axios.delete('http://localhost:1893/ruas/' + req.params.id)
  .then(resp => {
    res.status(200).redirect('/');
  })
  .catch(error => {
    res.status(500).render('error', { "error": error });
  });
});

// Route for rendering the 'criar' page
router.get('/criar', function(req, res) {
  var date = new Date().toISOString().substring(0, 16);
  res.render('novaRua', { "Data": date });
});

// Route for handling the form submission
router.post('/criar', function(req, res) {
  var rua = req.body.rua;
  axios.post('http://localhost:1893/ruas/', { rua: rua })
  .then(resp => {
    res.redirect('/');
  })
  .catch(error => {
    res.status(500).render('error', { "error": error });
  });
});

router.get('/:id', function(req, res, next) {
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas/' + req.params.id)
  .then(resp => {
    var rua = resp.data;
    
    res.status(200).render('rua', { "Rua": rua, "Data": date });
  })
  .catch(error => {
    console.log(error);
    res.status(500).render('error', { "error": error });
  });
});




module.exports = router;
