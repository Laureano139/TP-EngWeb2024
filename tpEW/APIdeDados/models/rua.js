const mongoose = require('mongoose');

var refSchema = new mongoose.Schema({
    entidades: [
        {
            nome: String,
            tipo: {
                type: String,
                enum : ['pessoa', 'instituição', 'empresa', 'família'],
                default: 'pessoa'
            }
        }
    ],
    lugares: [
        {
            nome : String,
            norm : String
        }
    ],
    datas: [String]
});

var figuraSchema = new mongoose.Schema({
    _id: String,
    legenda: String,
    imagem: {
        path : String,
        largura : String
    }
});

const ruaSchema = new mongoose.Schema({
    numero : Number,
    nome : String,
    pos : {
        latitude : Number,
        longitude : Number
    },
    figuras : [figuraSchema],
    paragrafo : {
        refs : refSchema,
        texto : String
    },
    casas : [
        {
            numero : Number,
            enfiteutas : String,
            foro : String,
            desc : {
                refs : refSchema,
                texto : String
            },
            vista : String
        }
    ]

}, { versionKey: false });

module.exports = mongoose.model('ruas', ruaSchema);