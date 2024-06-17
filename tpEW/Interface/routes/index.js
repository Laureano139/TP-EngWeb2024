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
  var imagesDir = path.join(__dirname, '../public/atual');
  fs.readdir(imagesDir, function(err, files) {
    if (err) {
      return next(err);
    }
    var images = files.map(file => '/atual/' + file);
    res.render('index', { images: images });
  });
});


router.get('/ruas', verificaToken, function(req, res, next) {
  levelUser="Utilizador"
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    try {
      const tk = jwt.verify(token, 'EngWeb2024RuasDeBraga');
      levelUser = tk.level;
      console.log("LEVEL USER -> " + levelUser)
      username = tk.username
    } catch (e) {
      tokenBool=false
    }
  }
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas/')
  .then(resp => {
    var ruas = resp.data;
    res.status(200).render('listaRuas', { "Ruas": ruas, "Data": date, "level": levelUser, "username": username});
  })
  .catch(error => {
    res.status(500).render('error', { "error": error });
  });
});

// Apagar uma Rua
// METER AUTH
router.get('/delete/:id', function(req, res) {
  axios.get('http://localhost:1893/ruas/' + req.params.id)
  .then(resp => { 
    var rua = resp.data;
    let imagePaths = [];
    rua.figuras.forEach(figura => {
      imagePaths.push(figura.imagem.path);
    });
    const publicPath = path.resolve(__dirname, '../public');
    imagePaths.forEach(relativePath => {
      const absolutePath = path.join(publicPath, relativePath.slice(2));
      console.log(`Trying to delete file: ${absolutePath}`);
      fs.unlink(absolutePath, err => {
        if (err) {
          console.error(`Error deleting file ${absolutePath}:`, err);
        } else {
          console.log(`File ${absolutePath} successfully deleted`);
        }
      });
    });
    axios.delete('http://localhost:1893/ruas/' + req.params.id)
    .then(() => {
      res.status(200).redirect('/ruas');
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
  levelUser="Utilizador";
  tokenBool="false"
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true

    jwt.verify(token, 'EngWeb2024RuasDeBraga',(e, payload)=>{
      if(e){
        console.log('Token is expired [GET CRIAR]');
        tokenBool= false
      }
    })
  }
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
  res.status(200).redirect('/ruas');
  
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
router.post('/:id/post', verificaToken, function(req, res) {
  req.body.data = Date().substring(0,24);
  levelUser = "Utilizador"
  tokenBool = false

  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    username= ""
    console.log("Token: " + token)
    try {
      const tk = jwt.verify(token, 'EngWeb2024RuasDeBraga');
      username = tk.username;
      console.log("User: " + username)
    } catch (e) {
      tokenBool=false
      console.log("Catch fodeu")
    }
  }
  req.body.autor = username
  axios.post("http://localhost:1893/ruas/" + req.params.id + "/post", req.body)
    .then(response => {
        res.redirect("/" + req.params.id);
    })
    .catch(erro => {
      res.render("error", {message: "erro ao publicar comentário na rua", error : erro})
    })
});

router.get('/:idRua/unpost/:id', verificaToken, function(req,res,next) {
  tokenBool=true
  axios.delete("http://localhost:1893/ruas/" + req.params.idRua + "/unpost/" + req.params.id)
    .then(response => {
        res.redirect("/" + req.params.idRua);
    })
    .catch(erro => {
      res.render("error", {message: "erro ao eliminar uma casa da respetiva rua", error : erro})
    })
});

// --------------------------------------------------------------//


// --------------------------------------------------------------//
// Editar uma Rua
// --------------------------------------------------------------//

router.get('/editar/:id', verificaToken, function(req, res) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas/' + req.params.id)
    .then(response => {
      const rua = response.data;
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
          comentarios: req.body.comentarios
        };
        let paths_naoEliminados = [];
        if (req.body.figuras_atual_paths) {
          paths_naoEliminados.push(...req.body.figuras_atual_paths);
        }
        if (req.body.figuras_antigas_paths) {
          paths_naoEliminados.push(...req.body.figuras_antigas_paths);
        }   
        paths_naoEliminados.forEach(path => {
          var fig = oldFiguras.find(figura => figura.imagem.path == path);
          if (fig) {
            updatedRua.figuras.push(fig);
          }
        }); 
        var paths_eliminados = oldFiguras.map(figura => figura.imagem.path).filter(path => !paths_naoEliminados.includes(path));    
        console.log('updatedRua_1:', updatedRua);
        if (req.body.entidades && req.body.entidades.nome && req.body.entidades.tipo) {
          for (let i = 0; i < req.body.entidades.nome.length; i++) {
            updatedRua.paragrafo.refs.entidades.push({
              nome: req.body.entidades.nome[i],
              tipo: req.body.entidades.tipo[i]
            });
          }
        }
        if (req.body.lugares && req.body.lugares.nome && req.body.lugares.norm) {
          for (let i = 0; i < req.body.lugares.nome.length; i++) {
            updatedRua.paragrafo.refs.lugares.push({
              nome: req.body.lugares.nome[i],
              norm: req.body.lugares.norm[i]
            });
          }
        }
        if (req.body.datas) {
          updatedRua.paragrafo.refs.datas = req.body.datas;
        }
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
        if (req.files) {
          console.log('req.files:', req.files);
          Object.keys(req.files).forEach(key => {
            req.files[key].forEach((file, index) => {
              let legendaKey = 'legenda_' + key;
              let legenda = req.body[legendaKey] && req.body[legendaKey][index] ? req.body[legendaKey][index] : req.body[legendaKey];
              if (Array.isArray(legenda)) {
                legenda = legenda[index] || '';
              } else {
                legenda = legenda || '';
              }
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
        const publicPath = path.resolve(__dirname, '../public');

        paths_eliminados.forEach(relativePath => {
          const absolutePath = path.join(publicPath, relativePath.slice(2));
          console.log(`Trying to delete file: ${absolutePath}`);
          fs.unlink(absolutePath, err => {
            if (err) {
              console.error(`Error deleting file ${absolutePath}:`, err);
            } else {
              console.log(`File ${absolutePath} successfully deleted`);
            }
          });
        });
        axios.put(`http://localhost:1893/ruas/${req.params.id}`, updatedRua)
            .then(() => {
                res.status(200).redirect("/ruas");
            })
            .catch(error => {
                console.error(error);
                res.status(500).render("error", { "error": error });
            });
    });
  
});

// --------------------------------------------------------------//

router.get('/datas/:data', verificaToken ,function(req, res, next) {
  levelUser="Utilizador"
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    try {
      const tk = jwt.verify(token, 'EngWeb2024RuasDeBraga');
      console.log("LEVEL USER -> " + levelUser)
      username = tk.username
    } catch (e) {
      tokenBool=false
    }
  }
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas?data=' + req.params.data)
  .then(resp => {
    var ruas = resp.data;
    res.status(200).render('datas', { "Ruas": ruas,  "data": req.params.data, "date": date, "username": username});
  })
  .catch(error => {
    res.status(500).render('error', { "error": error });
  });
});

router.get('/entidades/:entidade', verificaToken, function(req, res, next) {
  levelUser="Utilizador"
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    try {
      const tk = jwt.verify(token, 'EngWeb2024RuasDeBraga');
      console.log("LEVEL USER -> " + levelUser)
      username = tk.username
    } catch (e) {
      tokenBool=false
    }
  }
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas?entidade=' + req.params.entidade)
  .then(resp => {
    var ruas = resp.data;
    res.status(200).render('entidades', { "Ruas": ruas, "Entidade": req.params.entidade, "date": date, "username": username});
  })
  .catch(error => {
    res.status(500).render('error', { "error": error });
  });
});

router.get('/lugares/:lugar', verificaToken,function(req, res, next) {
  levelUser="Utilizador"
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    try {
      const tk = jwt.verify(token, 'EngWeb2024RuasDeBraga');
      console.log("LEVEL USER -> " + levelUser)
      username = tk.username
    } catch (e) {
      tokenBool=false
    }
  }
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas?lugar=' + req.params.lugar)
  .then(resp => {
    var ruas = resp.data;
    res.status(200).render('lugares', { "Ruas": ruas, "Lugar": req.params.lugar, "date": date, "username": username});
  })
  .catch(error => {
    res.status(500).render('error', { "error": error });
  });
});

router.get('/register', function(req,res) {
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    jwt.verify(token, 'EngWeb2024RuasDeBraga',(e, payload)=>{
      if(e){
        console.log('Token is expired [GET REGISTER]');
        tokenBool= false
      }
    })
  }
  res.render('registerForm', {t: tokenBool})
})

router.get('/logout', function(req, res){
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    jwt.verify(token, 'EngWeb2024RuasDeBraga',(e, payload)=>{
      if(e){
        console.log('Token is expired [GET LOGOUT]');
        tokenBool= false
      }
    })
  }
  res.render('testeLogout', {t:tokenBool})
})

router.get('/login', function(req, res){
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    console.log("GET LOGIN TOKEN -> " + token)
    tokenBool = true
    jwt.verify(token, 'EngWeb2024RuasDeBraga',(e, payload)=>{
      if(e){
        console.log('Token is expired [GET LOGIN]');
        tokenBool= false
      }
    })
  }
  res.render('loginForm', {t: tokenBool})
})

router.get('/:id', function(req, res, next) {
  levelUser="Utilizador"
  tokenBool = false
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
    tokenBool = true
    try {
      const tk = jwt.verify(token, 'EngWeb2024RuasDeBraga');
      levelUser = tk.level;
      console.log("LEVEL USER -> " + levelUser)
      username = tk.username
    } catch (e) {
      tokenBool=false
    }
  }
  var date = new Date().toISOString().substring(0, 16);
  axios.get('http://localhost:1893/ruas/' + req.params.id)
    .then(resp => {
      var rua = resp.data;
      if (rua.paragrafo && rua.paragrafo.refs) {
        var entidades = rua.paragrafo.refs.entidades.reduce((unique, entidade) => {
            if (!unique.some(obj => obj.nome === entidade.nome)) {
              unique.push(entidade);
            }
            return unique;
        }, []);

        var lugares = rua.paragrafo.refs.lugares.reduce((unique, lugar) => {
            if (!unique.some(obj => obj.nome === lugar.nome)) {
              unique.push(lugar);
            }
            return unique;
        }, []);
        var datas = [...new Set(rua.paragrafo.refs.datas)];


        function escapeRegExp(string) {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        function safeReplace(text, searchValue, replaceValue) {
          const regex = new RegExp(`\\b${escapeRegExp(searchValue)}\\b`, 'g');
          return text.replace(regex, replaceValue);
        }
        if (rua.paragrafo.texto) {
          entidades.forEach(entidade => {
            rua.paragrafo.texto = safeReplace(rua.paragrafo.texto, entidade.nome, `<a href="http://localhost:1894/entidades/${encodeURIComponent(entidade.nome)}">${entidade.nome}</a>`);
          });

          lugares.forEach(lugar => {
            rua.paragrafo.texto = safeReplace(rua.paragrafo.texto, lugar.nome, `<a href="http://localhost:1894/lugares/${encodeURIComponent(lugar.nome)}">${lugar.nome}</a>`);
          });

          datas.forEach(data => {
            rua.paragrafo.texto = safeReplace(rua.paragrafo.texto, data, `<a href="http://localhost:1894/datas/${data}">${data}</a>`);
          });
        }
      }
      res.status(200).render('rua', { "Rua": rua, "Data": date, "level": levelUser, "username": username});
    })
    .catch(error => {
      console.log(error);
      res.status(500).render('error', { "error": error });
    });
});

router.post('/register', function(req, res){
  console.log("Register TOKEN: " + req.cookies.token)
  if(req.cookies && req.cookies.token){
    token = req.cookies.token
  }
  axios.post('http://localhost:1925/users/register?token='+token, req.body)
    .then(response => {
      res.cookie('token', response.data.token)
      res.redirect('/ruas')
    })
    .catch(e =>{
      res.render('error', {error: e, message: "Credenciais inválidas"})
    })
})


router.post('/login', function(req, res){
  axios.post('http://localhost:1925/users/login', req.body)
    .then(response => {
      res.cookie('token', response.data.token)
      res.redirect('/ruas')
    })
    .catch(e =>{
      res.render('error', {error: e, message: "Credenciais inválidas"})
    })
})

router.post('/logout', verificaToken, function(req, res){
  res.clearCookie('token')
  res.redirect('/')
})

module.exports = router;
