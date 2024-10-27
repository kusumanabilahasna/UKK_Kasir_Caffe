const mejaModel = require(`../models/index`).meja
const Op = require("sequelize").Op

exports.getAllMeja = async (request, response) => {
    try {
        let meja = await mejaModel.findAll()
        return response.json({
            status: true,
            data: meja
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.statusMeja = async (request, response) => {
    try {
      const param = { status: request.params.status };
      const meja = await mejaModel.findAll({ where: param });
      if (meja.length > 0) { 
        return response.json({ 
          status: "success",
          data: meja,
        });
      } else { 
        return response.status(404).json({ 
          status: "error",
          message: "data tidak ditemukan",
        });
      }
    } catch (error) { 
      return response.status(400).json({ 
        message: error.message,
      });
    }
}

exports.addMeja = async (request, response) => {
    try {
        let newMeja = {
            id_meja: request.body.id_meja,
            nomor_meja: request.body.nomor_meja,
            status: request.body.status,
        };

        await mejaModel.create(newMeja)
            .then(result => {
                return response.json({
                    status: true,
                    data: result,
                    message: `Data meja berhasil ditambahkan`
                })
            })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.updateMeja = async (request, response) => {
    try {
        let id_meja = request.params.id_meja
        let dataMeja = {
            nomor_meja: request.body.nomor_meja,
            status: request.body.status,
        };

        await mejaModel.update(dataMeja, { where: { id_meja: id_meja } })
            .then(result => {
                return response.json({
                    status: true,
                    message: `Data meja berhasil diubah`
                })
            })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.deleteMeja = async (request, response) => {
    try {
        let id_meja = request.params.id_meja
        await mejaModel.destroy({ where: { id_meja: id_meja } })
        return response.json({
            status: true,
            message: `Data meja berhasil dihapus`
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
};