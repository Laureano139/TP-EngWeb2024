//var express = require('express');
//var router = express.Router();
//const path = require('path');
//const fs = require('fs');
//
//const imageDir = path.join(__dirname, '/../datasetRuasBraga/materialBase/atual');
//
//router.use('/images', express.static(imageDir));
//
//router.get('/', function(req, res, next) {
//    fs.readdir(imageDir, (err, files) => {
//        if (err) {
//          console.error('Erro ao ler diretoria de imagens:', err);
//          return res.status(500).send('Erro no servidor!');
//        }
//        res.json({ title: 'Express', images: files });
//    });
//});
//
//module.exports = router;