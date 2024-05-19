var express = require('express');
var router = express.Router();
var Rua = require('../controllers/rua')
var fs = require('fs')

router.get('/', function(req, res) {
  if(req.query.nome){
    const nomeRua = req.query.nome
    Rua.findRuaByNome(nomeRua)
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
  }
  else if(req.query.data){
    const dataR = req.query.data
    Rua.listaRuasByData(dataR)
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
  }
  else if(req.query.lugar){
    const lugarRua = req.query.lugar
    Rua.listaRuasByLugar(lugarRua)
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
  }
  else{
    Rua.list()
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
  }
});

router.get('/:id', function(req, res) {
  Rua.findById(req.params.id)
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
});

router.post('/', function(req, res) {
  Rua.insert(req.body)
  .then(data => res.jsonp(data))
  .catch(erro => res.jsonp(erro))
});

router.delete("/:id", function(req, res) {
  Rua.deleteRua(req.params.id)
  .then(data => res.jsonp(data))
  .catch(erro => res.jsonp(erro))
});

router.put('/:id', function(req, res, next) {
  Rua.update(req.params.id, req.body)
  .then(dados => res.jsonp(dados))
  .catch(erro => res.jsonp(erro))
});

module.exports = router;