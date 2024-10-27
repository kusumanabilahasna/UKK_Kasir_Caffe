const express = require(`express`)
const app = express()

app.use(express.json())

const userController = require(`../controllers/user_controller`)
const { authorize } = require(`../controllers/auth_controller`)
const { validateUser } = require(`../middleware/user_validation`);
const { IsKasir, IsAdmin, IsManager } = require(`../middleware/role_validation`);

app.get(`/getall`, authorize, IsAdmin, userController.getAllUser)
app.get(`/find/:role`,authorize, userController.roleUser)
app.post(`/find`,authorize, IsAdmin, userController.findUser)
app.post(`/add`,authorize, IsAdmin, validateUser, userController.addUser)
app.put(`/update/:id_user`,authorize, IsAdmin, validateUser, userController.updateUser)
app.delete(`/delete/:id_user`,authorize, IsAdmin, userController.deleteUser)

module.exports = app