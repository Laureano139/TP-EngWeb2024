var express = require('express');
var router = express.Router();
var axios = require('axios');
var jwt = require('jsonwebtoken');
var multer  = require('multer');
var fs = require('fs');
var path = require('path');


function verificaToken(req, res, next){
  var myToken 
  if(req.query && req.query.token)
      myToken = req.query.token;
  else if(req.body && req.body.token) 
      myToken = req.body.token;
  else if(req.cookies && req.cookies.token)
      myToken = req.cookies.token
  else
      myToken = false;

  if(myToken){
      jwt.verify(myToken, "EngWeb2024RuasDeBraga", function(e, payload){
      if(e){
          res.status(401).jsonp({error: e})
      }
      else{
          next()
      }
    })
  }else{
      res.status(401).jsonp({error: "Token inexistente!!"})
    }
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = ''
    if(file.fieldname.startsWith('imagem')){
      dir = './public/imagem';
    }
    else if(file.fieldname.startsWith('atual')){
      dir = './public/atual';
    }
    ensureDirExists(dir);
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

var upload = multer({ storage: storage });


/* GET pagina com todas as ruas. */
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




// Apagar uma Rua
router.get('/delete/:id', function(req, res) {
  axios.get('http://localhost:1893/ruas/' + req.params.id)
  .then(resp => { 
    var rua = resp.data;
    let imagePaths = [];
    rua.figuras.forEach(figura => {
      imagePaths.push(figura.imagem.path);
    });

    // Delete image files
    imagePaths.forEach(imagePath => {
      imagePath = "/public" + imagePath.slice(2);
      fs.unlink(imagePath, err => {
        if (err) {
          console.error(`Error deleting file ${imagePath}:`, err);
        } else {
          console.log(`File ${imagePath} successfully deleted`);
        }
      });
    });

    // Delete rua
    axios.delete('http://localhost:1893/ruas/' + req.params.id)
    .then(() => {
      res.status(200).redirect('/');
    })
    .catch(error => {
      res.status(500).render('error', { "error": error });
    });
  });
});




//--------------------------------------------------------------//
// Criar uma Nova Rua
//--------------------------------------------------------------//
router.get('/criar', function(req, res) {
  var date = new Date().toISOString().substring(0, 16);
  res.render('novaRua', { "Data": date });
});


router.post('/criar', upload.fields([{ name: 'imagem', maxCount: 10 }, { name: 'atual', maxCount: 10 }]), function(req, res) {  
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
        entidades: [],
        lugares: [],
        datas: []
      },
      texto: req.body.texto
    },
    casas: []
  };

  console.log('Request body:', req.body);
  // Processar entidades
  if (req.body.entidades && req.body.entidades.nome && req.body.entidades.tipo) {
    for (let i = 0; i < req.body.entidades.nome.length; i++) {
      rua.paragrafo.refs.entidades.push({
        nome: req.body.entidades.nome[i],
        tipo: req.body.entidades.tipo[i]
      });
    }
  }

  // Processar lugares
  if (req.body.lugares && req.body.lugares.nome && req.body.lugares.norm) {
    for (let i = 0; i < req.body.lugares.nome.length; i++) {
      rua.paragrafo.refs.lugares.push({
        nome: req.body.lugares.nome[i],
        norm: req.body.lugares.norm[i]
      });
    }
  }


  // Processar datas
  if (req.body.datas) {
    rua.paragrafo.refs.datas = req.body.datas;
  }

  console.log('ola');

  
  if (req.body.casas && req.body.casas.numero) {
    for (let i = 0; i < req.body.casas.numero.length; i++) {
      rua.casas.push({
        numero: req.body.casas.numero[i],
        enfiteutas: req.body.casas.enfiteutas[i] || '',
        foro: req.body.casas.foro[i] || '',
        desc: {
          texto: req.body.casas.desc.texto[i] || '',
          refs: {
            entidades: JSON.parse(req.body.casas.desc.refs.entidades[i] || '[]'),
            lugares: JSON.parse(req.body.casas.desc.refs.lugares[i] || '[]'),
            datas: JSON.parse(req.body.casas.desc.refs.datas[i] || '[]')
          }
        }
      });
    }
  }
  
  // Processar figuras (imagens)
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

  console.log('Creating rua:', rua);
  res.status(200).redirect('/');
  
  
  // Enviar requisição para o serviço externo (exemplo com Axios)
  axios.post('http://localhost:1893/ruas/', rua)
    .then(resp => {
      console.log('Response:', resp.data);
       // Redirecionar após sucesso
    })
    .catch(error => {
      console.error('Error:', error);
      res.status(500).render('error', { error: error }); // Renderizar página de erro em caso de falha
    });
    
});
// --------------------------------------------------------------//


// --------------------------------------------------------------//
// Editar uma Rua
// --------------------------------------------------------------//

router.get('/editar/:id', function(req, res) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas/' + req.params.id)
    .then(response => {
      const rua = response.data;
      console.log('id:', response.data._id)
      if (!rua) {
        return res.status(404).json({ message: "Rua não encontrada" });
      }
      res.status(200).render('editarRua', {"rua": rua, "data": d});
    })
    .catch(error => {
      console.error(error);
      res.status(500).render('error', { "error": error });
    });
});

router.post('/editar/:id', upload.fields([{ name: 'imagem', maxCount: 10 }, { name: 'atual', maxCount: 10 }]), function(req, res) {
  
  axios.get(`http://localhost:1893/ruas/${req.params.id}`)
    .then(response => {
      const data = response.data;
      if (!data) {
        return res.status(404).json({ message: "Rua não encontrada" });
      }

      // Coletar todos os caminhos das imagens antigas
      let oldImagePaths = [];
      data.figuras.forEach(figura => {
        oldImagePaths.push(figura.imagem.path);
      });
    });

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
        entidades: [],
        lugares: [],
        datas: []
      },
      texto: req.body.texto
    },
    casas: []
  };

  // Processar entidades
  if (req.body.entidades && req.body.entidades.nome && req.body.entidades.tipo) {
    for (let i = 0; i < req.body.entidades.nome.length; i++) {
      updatedRua.paragrafo.refs.entidades.push({
        nome: req.body.entidades.nome[i],
        tipo: req.body.entidades.tipo[i]
      });
    }
  }

  // Processar lugares
  if (req.body.lugares && req.body.lugares.nome && req.body.lugares.norm) {
    for (let i = 0; i < req.body.lugares.nome.length; i++) {
      updatedRua.paragrafo.refs.lugares.push({
        nome: req.body.lugares.nome[i],
        norm: req.body.lugares.norm[i]
      });
    }
  }

  // Processar datas
  if (req.body.datas) {
    updatedRua.paragrafo.refs.datas = req.body.datas;
  }

  console.log('updatedRua_2:', updatedRua);

  // Processar casas
  if (req.body.casas && req.body.casas.numero) {
    for (let i = 0; i < req.body.casas.numero.length; i++) {
      updatedRua.casas.push({
        numero: req.body.casas.numero[i],
        enfiteutas: req.body.casas.enfiteutas[i] || '',
        foro: req.body.casas.foro[i] || '',
        desc: {
          texto: req.body.casas.desc.texto[i] || '',
          refs: {
            entidades: JSON.parse(req.body.casas.desc.refs.entidades[i] || '[]'),
            lugares: JSON.parse(req.body.casas.desc.refs.lugares[i] || '[]'),
            datas: JSON.parse(req.body.casas.desc.refs.datas[i] || '[]')
          }
        }
      });
    }
  }


  // Processar figuras (imagens)
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      req.files[key].forEach((file, index) => {
        let legendaKey = 'legenda_' + key;
        let legenda = req.body[legendaKey] && req.body[legendaKey][index] ? req.body[legendaKey][index] : req.body[legendaKey];
        if (key.startsWith('imagem')) {
          updatedRua.figuras.push({
            _id: file.filename.split('.')[0],
            legenda: legenda,
            imagem: {
              path: path.join('../imagem', file.filename),
              largura: null
            }
          });
        } else if (key.startsWith('atual')) {
          updatedRua.figuras.push({
            _id: file.filename.split('.')[0],
            legenda: legenda,
            imagem: {
              path: path.join('../atual', file.filename),
              largura: null
            }
          });
        }
      });
    });
  }

  console.log('updatedRua_3:', updatedRua);
  
  const newFileNames = updatedRua.figuras.map(figura => path.basename(figura.imagem.path));

  console.log('newFileNames:', newFileNames)
  console.log('oldImagePaths:', oldImagePaths)

  // Deletar os arquivos de imagem antigos
  oldImagePaths.forEach(imagePath => {
    const oldFileName = path.basename(imagePath);
    if (!newFileNames.includes(oldFileName)) {
      imagePath = "./public" + imagePath.slice(2);
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

  console.log('Updated Rua 4:', updatedRua);

  // Atualizar a rua no banco de dados
  axios.put(`http://localhost:1893/ruas/${req.params.id}`, updatedRua)
    .then(() => {
      res.status(200).redirect("/");
    })
    .catch(error => {
      console.error(error);
      res.status(500).render("error", { "error": error });
    });
});

// --------------------------------------------------------------//


router.get('/:id', function(req, res, next) {
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas/' + req.params.id)
  .then(resp => {
    var rua = resp.data;
    
    if (rua.paragrafo && rua.paragrafo.refs) {
      var entidades = rua.paragrafo.refs.entidades;
      var lugares = rua.paragrafo.refs.lugares;
      var datas = rua.paragrafo.refs.datas;
    
      // Replace each entity, place, and date in the text with its bold version
      entidades.forEach(entidade => {
        var regex = new RegExp(entidade.nome, 'g');
        rua.paragrafo.texto = rua.paragrafo.texto.replace(regex, '<b>' + entidade.nome + '</b>');
      });
    
      lugares.forEach(lugar => {
        var regex = new RegExp(lugar.nome, 'g');
        rua.paragrafo.texto = rua.paragrafo.texto.replace(regex, '<b>' + lugar.nome + '</b>');
      });
    
      datas.forEach(data => {
        var regex = new RegExp(data, 'g');
        rua.paragrafo.texto = rua.paragrafo.texto.replace(regex, '<b>' + data + '</b>');
      });
    }
    

    res.status(200).render('rua', { "Rua": rua, "Data": date });
  })
  .catch(error => {
    console.log(error);
    res.status(500).render('error', { "error": error });
  });
});


module.exports = router;
