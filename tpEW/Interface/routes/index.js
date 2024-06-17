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
       
    const publicPath = path.resolve(__dirname, '../public');

    // Delete image files
    imagePaths.forEach(relativePath => {
      const absolutePath = path.join(publicPath, relativePath.slice(2)); // Remover os dois pontos e obter o caminho absoluto
      console.log(`Trying to delete file: ${absolutePath}`); // Adicionar log para verificar o caminho
      fs.unlink(absolutePath, err => {
        if (err) {
          console.error(`Error deleting file ${absolutePath}:`, err);
        } else {
          console.log(`File ${absolutePath} successfully deleted`);
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

  // Processar casas
  if (req.body.casas && req.body.casas.numero) {
    for (let i = 0; i < req.body.casas.numero.length; i++) {
      let casa = {
        numero: req.body.casas.numero[i],
        enfiteutas: req.body.casas.enfiteutas[i] || '',
        foro: req.body.casas.foro[i] || '',
        desc: {
          texto: req.body.casas.desc.texto[i] || '',
          refs: {
            entidades: [],
            lugares: [],
            datas: []
          }
        }
      };

      // Processar entidades das casas
      if (req.body.casas.desc.refs.entidades && req.body.casas.desc.refs.entidades[i] && req.body.casas.desc.refs.entidades[i].nome) {
        for (let j = 0; j < req.body.casas.desc.refs.entidades[i].nome.length; j++) {
          casa.desc.refs.entidades.push({
            nome: req.body.casas.desc.refs.entidades[i].nome[j],
            tipo: req.body.casas.desc.refs.entidades[i].tipo[j]
          });
        }
      }

      // Processar lugares das casas
      if (req.body.casas.desc.refs.lugares && req.body.casas.desc.refs.lugares[i] && req.body.casas.desc.refs.lugares[i].nome) {
        for (let j = 0; j < req.body.casas.desc.refs.lugares[i].nome.length; j++) {
          casa.desc.refs.lugares.push({
            nome: req.body.casas.desc.refs.lugares[i].nome[j],
            norm: req.body.casas.desc.refs.lugares[i].norm[j]
          });
        }
      }

      // Processar datas das casas
      if (req.body.casas.desc.refs.datas && req.body.casas.desc.refs.datas[i]) {
        casa.desc.refs.datas = req.body.casas.desc.refs.datas[i].map(dateArray => dateArray[0]);
      }

      rua.casas.push(casa);
    }
  }
  
  // Processar figuras (imagens)
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      req.files[key].forEach((file, index) => {
        let legendaKey = 'legenda_' + key;
        let legenda = req.body[legendaKey] && req.body[legendaKey][index] ? req.body[legendaKey][index] : req.body[legendaKey];
        if (Array.isArray(legenda)) {
          legenda = legenda[index] || '';
        } else {
          legenda = legenda || '';
        }
  
        if (key.startsWith('imagem')) {
          file.filename = file.filename.replace(/\\/g, "/");
          rua.figuras.push({
            _id: file.filename.split('.')[0],
            legenda: legenda, // Use a legenda correta para cada arquivo
            imagem: {
              path: path.posix.join('../imagem', file.filename),
              largura: null
            }
          });
        } else if (key.startsWith('atual')) {
          rua.figuras.push({
            _id: file.filename.split('.')[0],
            legenda: legenda, // Use a legenda correta para cada arquivo
            imagem: {
              path: path.posix.join('../atual', file.filename),
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

// Publicar Comentário
router.post('/:id', function(req, res) {
  req.body.data = Date().substring(0,24);
  // levelUser = "Utilizador"
  // tokenBool = false

  // if(req.cookies && req.cookies.token){
  //   token = req.cookies.token
  //   tokenBool = true
  //   username= ""
  //   try {
  //     const tk = jwt.verify(token, 'EngWeb2024RuasDeBraga');
  //     username = tk.username;
  //   } catch (e) {
  //     tokenBool=false
  //   }
  // }

  // req.body.autor = username
  console.log(req.body)
  console.log("---------> REQ PARAMS ID: " + req.params.id)
  axios.post("http://localhost:1893/ruas/post/" + req.params.id, req.body)
    .then(response => {
        res.redirect("/ruas/" + req.params.id);
    })
    .catch(erro => {
      res.render("error", {message: "erro ao publicar comentário na rua", error : erro})
    })
});


router.get('/:idRua/unpost/:id', verificaToken, function(req,res,next) {
  axios.delete("http://localhost:1893/ruas/unpost/" + req.params.id)
    .then(response => {
        res.redirect("/ruas/" + req.params.idRua);
    })
    .catch(erro => {
      res.render("error", {message: "erro ao eliminar uma casa da respetiva rua", error : erro})
    })
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
        var rua = response.data;
        var oldFiguras = rua.figuras;
        
        var updatedRua = {
          _id: response.data._id,
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
          casas: [],
          comentarios: []
        };

        // Inicialize uma lista para armazenar os paths
        let paths_naoEliminados = [];
        // Adicione paths das figuras atuais
        if (req.body.figuras_atual_paths) {
          paths_naoEliminados.push(...req.body.figuras_atual_paths);
        }

        // Adicione paths das figuras antigas
        if (req.body.figuras_antigas_paths) {
          paths_naoEliminados.push(...req.body.figuras_antigas_paths);
        }   
        paths_naoEliminados.forEach(path => {
          // Find the figure in oldFiguras that corresponds to the path
          var fig = oldFiguras.find(figura => figura.imagem.path == path);
          if (fig) {
            updatedRua.figuras.push(fig);
          }
        }); 
        console.log('paths_naoEliminados ola:', paths_naoEliminados);   

        var paths_eliminados = oldFiguras.map(figura => figura.imagem.path).filter(path => !paths_naoEliminados.includes(path));    
        console.log('updatedRua_1:', updatedRua);
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
            let entidades = [];
            let lugares = [];
            let datas = [];

            if(!req.body.casas.desc.refs){
              continue
            }
          
            else if (req.body.casas.desc.refs.entidades[i]) {
              for (let j = 0; j < req.body.casas.desc.refs.entidades[i].length; j++) {
                entidades.push({
                  nome: req.body.casas.desc.refs.entidades[i][j] || '',
                  tipo: req.body.casas.desc.refs['entidades-tipo'][i][j] || ''
                });
              }
            }
          
            if (req.body.casas.desc.refs.lugares[i]) {
              for (let j = 0; j < req.body.casas.desc.refs.lugares[i].length; j++) {
                lugares.push({
                  nome: req.body.casas.desc.refs.lugares[i][j] || '',
                  norm: req.body.casas.desc.refs['lugares-norm'][i][j] || ''
                });
              }
            }
          
            if (req.body.casas.desc.refs.datas[i]) {
              datas = req.body.casas.desc.refs.datas[i];
            }
          
            updatedRua.casas.push({
              numero: req.body.casas.numero[i],
              enfiteutas: req.body.casas.enfiteutas[i] || '',
              foro: req.body.casas.foro[i] || '',
              desc: {
                texto: req.body.casas.desc.texto[i] || '',
                refs: {
                  entidades: entidades,
                  lugares: lugares,
                  datas: datas
                }
              }
            });
          }
        }
        // Processar figuras (imagens) adicionadas
        if (req.files) {
          console.log('req.files:', req.files);
          Object.keys(req.files).forEach(key => {
            req.files[key].forEach((file, index) => {
              let legendaKey = 'legenda_' + key;
              let legenda = req.body[legendaKey] && req.body[legendaKey][index] ? req.body[legendaKey][index] : req.body[legendaKey];
              file.filename = file.filename.replace(/\\/g, "/");
              if (key.startsWith('imagem')) {
                console.log('legendas:', legenda);
                updatedRua.figuras.push({
                  _id: file.filename.split('.')[0],
                  legenda: legenda,
                  imagem: {
                    path: path.posix.join('../imagem', file.filename),
                    largura: null
                  }
                });
              } else if (key.startsWith('atual')) {
                updatedRua.figuras.push({
                  _id: file.filename.split('.')[0],
                  legenda: legenda,
                  imagem: {
                    path: path.posix.join('../atual', file.filename),
                    largura: null
                  }
                });
              }
            });
          });
        }

        console.log('updatedRua_3:', updatedRua);
        console.log('paths_eliminados:', paths_eliminados);
        // Remover imagens apagadas 
        const publicPath = path.resolve(__dirname, '../public');

        paths_eliminados.forEach(relativePath => {
          const absolutePath = path.join(publicPath, relativePath.slice(2)); // Remover os dois pontos e obter o caminho absoluto
          console.log(`Trying to delete file: ${absolutePath}`); // Adicionar log para verificar o caminho
          fs.unlink(absolutePath, err => {
            if (err) {
              console.error(`Error deleting file ${absolutePath}:`, err);
            } else {
              console.log(`File ${absolutePath} successfully deleted`);
            }
          });
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
  
});

// --------------------------------------------------------------//


router.get('/:id', function(req, res, next) {
  var date = new Date().toISOString().substring(0, 16);
  console.log("---------> REQ PARAMS ID: " + req.params.id)
  axios.get('http://localhost:1893/ruas/' + req.params.id)
  .then(resp => {
    var rua = resp.data;
    console.log("---------> RUA: " + rua)
    
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
