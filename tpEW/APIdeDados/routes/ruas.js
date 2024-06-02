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


router.post('/', upload.fields([{ name: 'imagem', maxCount: 10 }, { name: 'atual', maxCount: 10 }]), function(req, res) {
  console.log(req.body)
  var rua = {
    _id: req.body._id,
    numero: req.body.numero,
    nome: req.body.nome,
    pos: {
      latitude: req.body.latitude,
      longitude: req.body.longitude
    },
    figuras: [],
    paragrafo: {
      refs: {
        entidades: JSON.parse(req.body.entidades || '[]'),
        lugares: JSON.parse(req.body.lugares || '[]'),
        datas: JSON.parse(req.body.datas || '[]')
      },
      texto: req.body.texto
    },
    casas: JSON.parse(req.body.casas || '[]')
  };

  if (req.files) {
    Object.keys(req.files).forEach(key => {
      req.files[key].forEach((file, index) => {
        let legendaKey = 'legenda_' + key;
        let legenda = req.body[legendaKey] && req.body[legendaKey][index] ? req.body[legendaKey][index] : req.body[legendaKey];
        if (key.startsWith('imagem')) {
          rua.figuras.push({
            _id: file.filename.split('.')[0],
            legenda: legenda, // Use a legenda correta para cada arquivo
            imagem: {
              path: path.join('../imagem', file.filename),
              largura: null
            }
          });
        } else if (key.startsWith('atual')) {
          rua.figuras.push({
            _id: file.filename.split('.')[0],
            legenda: legenda, // Use a legenda correta para cada arquivo
            imagem: {
              path: path.join('../atual', file.filename),
              largura: null
            }
          });
        }
      });
    });
  }

  Rua.insert(rua)
    .then(data => {
      res.status(201).jsonp(data);
    })
    .catch(erro => res.jsonp(erro));
});

router.delete("/:id", function(req, res) {
  // Primeiro, encontrar a rua para obter os caminhos das imagens
  Rua.findById(req.params.id)
    .then(data => {
      if (!data) {
        return res.status(404).json({ message: "Rua não encontrada" });
      }

      // Coletar todos os caminhos das imagens
      let imagePaths = [];
      data.figuras.forEach(figura => {
        imagePaths.push(figura.imagem.path);
      });

      // Deletar os arquivos de imagem
      imagePaths.forEach(imagePath => {
        imagePath = "../Interface/public" + imagePath.slice(2);
        fs.unlink(imagePath, err => {
          if (err) {
            console.error(`Erro ao deletar o arquivo ${imagePath}:`, err);
          } else {
            console.log(`Arquivo ${imagePath} deletado com sucesso`);
          }
        });
      });

      // Deletar o registro do banco de dados
      return Rua.deleteRua(req.params.id)
        .then(() => {
          res.jsonp({ message: "Rua e suas imagens deletadas com sucesso" });
        });
    })
    .catch(erro => res.jsonp(erro));
});


router.put('/:id', upload.fields([{ name: 'imagem', maxCount: 10 }, { name: 'atual', maxCount: 10 }]), function(req, res, next) {
  // Primeiro, encontrar a rua atual para obter os caminhos das imagens antigas
  Rua.findById(req.params.id)
    .then(data => {
      if (!data) {
        return res.status(404).json({ message: "Rua não encontrada" });
      }

      // Coletar todos os caminhos das imagens antigas
      let oldImagePaths = [];
      data.figuras.forEach(figura => {
        oldImagePaths.push(figura.imagem.path);
      });


      // Preparar os novos dados para a atualização
      var updatedRua = {
        _id: req.params.id,
        numero: req.body.numero,
        nome: req.body.nome,
        pos: {
          latitude: req.body.latitude,
          longitude: req.body.longitude
        },
        figuras: [],
        paragrafo: {
          refs: {
            entidades: JSON.parse(req.body.entidades || '[]'),
            lugares: JSON.parse(req.body.lugares || '[]'),
            datas: JSON.parse(req.body.datas || '[]')
          },
          texto: req.body.texto
        },
        casas: JSON.parse(req.body.casas || '[]')
      };

      if (req.files) {
        Object.keys(req.files).forEach(key => {
          req.files[key].forEach((file, index) => {
            let legendaKey = 'legenda_' + key;
            let legenda = req.body[legendaKey] && req.body[legendaKey][index] ? req.body[legendaKey][index] : req.body[legendaKey];
            if (key.startsWith('imagem')) {
              console.log(file.filename)
              updatedRua.figuras.push({
                _id: file.filename.split('.')[0],
                legenda: legenda, // Use a legenda correta para cada arquivo
                imagem: {
                  path: path.join('../imagem', file.filename),
                  largura: null
                }
              });
            } else if (key.startsWith('atual')) {
              console.log(file.filename)
              updatedRua.figuras.push({
                _id: file.filename.split('.')[0],
                legenda: legenda, // Use a legenda correta para cada arquivo
                imagem: {
                  path: path.join('../atual', file.filename),
                  largura: null
                }
              });
            }
          });
        });
      }

      newFileNames = updatedRua.figuras.map(figura => path.basename(figura.imagem.path));

      // Deletar os arquivos de imagem antigos
      oldImagePaths.forEach(imagePath => {
        let oldFileName = path.basename(imagePath);
        if (!newFileNames.includes(oldFileName)) {
          imagePath = "../Interface/public" + imagePath.slice(2);
          console.log(`Deletando arquivo ${imagePath}`);
          fs.unlink(imagePath, err => {
            if (err) {
              console.error(`Erro ao deletar o arquivo ${imagePath}:`, err);
            } else {
              console.log(`Arquivo ${imagePath} deletado com sucesso`);
            }
          });
        }
      });

      // Atualizar o registro no banco de dados
      Rua.update(req.params.id, updatedRua)
        .then(dados => {
          res.jsonp(dados);
        })
        .catch(erro => res.jsonp(erro));
    })
    .catch(erro => res.jsonp(erro));
});


module.exports = router;