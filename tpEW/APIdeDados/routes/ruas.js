var express = require('express');
var router = express.Router();
var Rua = require('../controllers/rua')
var multer = require('multer')
var fs = require('fs')
var path = require('path')


function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = ''
    if(file.fieldname.startsWith('imagem')){
      dir = '../Interface/public/imagem';
    }
    else if(file.fieldname.startsWith('atual')){
      dir = '../Interface/public/atual';
    }
    ensureDirExists(dir);
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

var upload = multer({ storage: storage });

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
    .then(data =>{
       res.jsonp(data)
      })
    .catch(erro => res.jsonp(erro))
  }
});

router.get('/:id', function(req, res) {
  console.log(req.params.id)
  Rua.findById(req.params.id)
    .then(data => {
      res.jsonp(data) 
      console.log(data)
    })
    .catch(erro => res.jsonp(erro))
});


router.post('/', function(req, res) {
  console.log(req.body)
  Rua.insert(req.body)
    .then(data => {
      res.status(201).jsonp(data);
    })
    .catch(erro => res.jsonp(erro));
});

// Publicar comentário

router.post("/post/:id", function(req,res,next) {
  Rua.adicionarComentario(req.params.id, req.body)
  .then(resp => { res.status(200).jsonp(resp) })
  .catch(erro => { res.status(509).jsonp(erro) })
})

router.delete("/:id", function(req, res) {
  Rua.deleteRua(req.params.id)
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
});



router.delete("/unpost/:id", function(req,res,next) {
  Rua.removerComentario(req.params.id)
  .then(resposta => { res.status(200).jsonp(resposta) })
  .catch(erro => { res.status(509).jsonp(erro) })
});


router.put('/:id', function(req, res) {
  console.log(req.body)
  Rua.update(req.params.id, req.body)
    .then(data => res.jsonp(data))
    .catch(erro => res.jsonp(erro))
});

module.exports = router;