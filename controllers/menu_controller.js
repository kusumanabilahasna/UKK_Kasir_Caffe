const menuModel = require(`../models/index`).menu
const upload = require(`./upload_image_menu`).single(`gambar`)
const { validateMenu } = require(`../middleware/menu_validation`);
const path = require(`path`)
const fs = require(`fs`)
const { Op } = require("sequelize")

exports.getAllMenu = async (request, response) => {
    try {
        let result = await menuModel.findAll()
        return response.json({
            status: true,
            data: result
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.addMenu = async (request, response) => {
    try {
        upload(request, response, async error => {
            if (error) {
                return response.json({
                    status: false,
                    message: error
                })
            }
            
            if (!request.file) {
                return response.json({
                    status: false,
                    message: `Nothing file to upload`
                })
            }

            let newMenu = {
                id_menu: request.body.id_menu,
                nama_menu: request.body.nama_menu,
                jenis: request.body.jenis,
                deskripsi: request.body.deskripsi,
                gambar: request.file.filename,
                harga: request.body.harga
            };

            await menuModel.create(newMenu)
                .then(result => {
                    return response.json({
                        status: true,
                        data: result,
                        message: `Data menu berhasil ditambahkan`
                    })
                })
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.filterMenu = async (request, response) => {
    try {
        let keyword = request.body.keyword
        let result = await menuModel.findAll({
            where: {
                [Op.or]: {
                    nama_menu: { [Op.substring]: keyword },
                    jenis: { [Op.substring]: keyword },
                    deskripsi: { [Op.substring]: keyword }
                }
            }
        })
        return response.json({
            status: true,
            data: result
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.updateMenu = async (request, response) => {
    try {
        upload(request, response, async error => {
            if (error) {
                return response.json({
                    status: false,
                    message: error
                })
            }
            let id_menu = request.params.id_menu

            let newMenu = {
                nama_menu: request.body.nama_menu,
                jenis: request.body.jenis,
                deskripsi: request.body.deskripsi,
                gambar: request.file.filename,
                harga: request.body.harga
            };

            let selectedMenu = await menuModel.findOne({ where: { id_menu: id_menu } })
            if (request.file) {
                let oldFilename = selectedMenu.gambar
                let pathFile = path.join(__dirname, `../menu_image`, oldFilename)
                if (fs.existsSync(pathFile)) {
                    fs.unlink(pathFile, error => { console.log(error) })
                }
                newMenu.gambar = request.file.filename
            }
            await menuModel.update(newMenu, { where: { id_menu: id_menu } })
                .then(result => {
                    return response.json({
                        status: true,
                        message: `Data menu berhasil diubah`
                    })
                })
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.deleteMenu = async (request, response) => {
    try {
        let id_menu = request.params.id_menu
        let selectedMenu = await menuModel.findOne({ where: { id_menu: id_menu } })
        let pathFile = path.join(__dirname, `../menu_image`, selectedMenu.gambar)
        if (fs.existsSync(pathFile)) {
            fs.unlinkSync(pathFile, error => { console.log(error) })
        }
        await menuModel.destroy({ where: { id_menu: id_menu } })
        return response.json({
            status: true,
            message: `Data menu berhasil dihapus`
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}