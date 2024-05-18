var mongoose = require("mongoose")
const { modelName } = require("../models/rua")
var Rua = require("../models/rua")

module.exports.list = async () => {
  return await Rua
    .find()
    .exec();
}

module.exports.findById = id => {
  return Rua
    .findOne({ _id : id })
    .exec();
}

module.exports.findRuaByNome = (nome) => {
  return Rua
  .findOne({nome: nome})
  .exec()
};

module.exports.listaRuasByData = async (data) => {
  const regexSearch = new RegExp(data, 'gi');
  return Rua.find({
      $or: [
          { "casas.desc.refs.datas": regexSearch },
          { "paragrafo.refs.datas": regexSearch }
      ]
  })
  .setOptions({ sanitizeFilter: true })
  .sort({ numero: 1 })
  .exec();
};

module.exports.listaRuasByLugar = async (lugar) => {
  const regexSearch = new RegExp(lugar, 'gi');
  return Rua.find({
      $or: [
          { "casas.desc.refs.lugares.nome": regexSearch },
          { "paragrafo.refs.lugares.nome": regexSearch }
      ]
  })
  .setOptions({ sanitizeFilter: true })
  .sort({ numero: 1 })
  .exec();
};