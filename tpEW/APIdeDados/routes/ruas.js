var express = require('express');
var router = express.Router();
var Rua = require('../controllers/rua')
var fs = require('fs')

router.get('/', function(req, res) {
    Rua.list()
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
});

router.get('/:id', function(req, res) {
  Rua.findById(req.params.id)
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
});

module.exports = router;