var express = require('express');
var router = express.Router();
var axios = require('axios');


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

router.get('/delete/:id', function(req, res, next) {
  axios.delete('http://localhost:1893/ruas/' + req.params.id)
  .then(resp => {
    res.status(200).redirect('/');
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
