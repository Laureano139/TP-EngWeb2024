const mongoose = require('mongoose');

var refSchema = new mongoose.Schema({
    entidades: [
        {
            nome: String,
            tipo: {
                type: String,
                enum: ['pessoa', 'instituição', 'empresa', 'família'],
                default: 'pessoa'
            }
        }
    ],
    lugares: [
        {
            nome: String,
            norm: String
        }
    ],
    datas: [String]
}, { _id: false });

var figuraSchema = new mongoose.Schema({
    _id: String,
    legenda: String,
    imagem: {
        path: String,
        largura: String
    }
});

var casasSchema = new mongoose.Schema({
    numero: String, // Convert numero to String
    enfiteutas: String,
    foro: String,
    desc: {
        refs: refSchema,
        texto: String
    },
    vista: String
}, { _id: false });


const ruaSchema = new mongoose.Schema({
    _id: String, // Add _id here
    numero: String, // Convert numero to String
    nome: String,
    pos: {
        latitude: Number,
        longitude: Number
    },
    figuras: [figuraSchema],
    paragrafo: {
        refs: refSchema,
        texto: String
    },
    casas: [casasSchema]
}, { versionKey: false });

module.exports = mongoose.model('ruas', ruaSchema);
