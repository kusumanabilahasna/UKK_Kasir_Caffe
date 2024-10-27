const userModel = require(`../models/index`).user
const Op = require("sequelize").Op
const md5 = require(`md5`)
const { where } = require("sequelize");

exports.getAllUser = async (request, response) => {
    try {
        let result = await userModel.findAll()
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

exports.findUser = async (request, response) => {
    try {
        let keyword = request.body.keyword
        let users = await userModel.findAll({
            where: {
                [Op.or]: {
                    nama_user: { [Op.substring]: keyword },
                    role: { [Op.substring]: keyword },
                    username: { [Op.substring]: keyword }
                }
            }
        })
        return response.json({
            status: true,
            data: users
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.addUser = async (request, response) => {
    try {
        let newUser = {
            id_user: request.body.id_user,
            nama_user: request.body.nama_user,
            role: request.body.role,
            username: request.body.username,
            password: md5(request.body.password),
        };

        await userModel.create(newUser)
            .then(result => {
                return response.json({
                    success: true,
                    data: result,
                    message: `User baru telah ditambahkan`,
                })
            })
    } catch (error) {
        return response.json({
            success: false,
            message: error.message,
        });
    }
}

exports.updateUser = async (request, response) => {
    try {
        let dataUser = {
            nama_user: request.body.nama_user,
            role: request.body.role,
            username: request.body.username,
        };
        if (request.body.password) {
            request.body.password = md5(request.body.password)
        }

        let id_user = request.params.id_user;
        await userModel.update(dataUser, { where: { id_user: id_user } })
            .then((result) => {
                return response.json({
                    status: true,
                    data: dataUser,
                    message: `Data user berhasil diubah`
                })
            })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.deleteUser = async (request, response) => {
    try {
        let id_user = request.params.id_user
        await userModel.destroy({ where: { id_user: id_user } })
        return response.json({
            status: true,
            message: `Data user berhasil dihapus`
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.roleUser = async (request, response) => {
    try {
        const param = { role: request.params.role };
        const user = await userModel.findAll({ where: param });
        if (user.length > 0) {
            return response.json({
                status: "success",
                data: user,
            });
        } else {
            return response.status(404).json({
                status: "error",
                message: "data tidak ditemukan",
            });
        }
    } catch (error) {
        return response.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};
