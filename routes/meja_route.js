const express = require(`express`)
const app = express()

app.use(express.json())

const { authorize } = require(`../controllers/auth_controller`)
const mejaController = require(`../controllers/meja_controller`)
const { validateMeja } = require(`../middleware/meja_validation`);
const { IsKasir, IsAdmin, IsManager } = require(`../middleware/role_validation`);


app.get(`/getall`, authorize, mejaController.getAllMeja)
app.get(`/status/:status`,authorize, mejaController.statusMeja)
app.post(`/add`, authorize, IsAdmin, validateMeja, mejaController.addMeja)
app.put(`/update/:id_meja`, authorize, IsAdmin, validateMeja, mejaController.updateMeja)
app.delete(`/delete/:id_meja`,authorize, IsAdmin, mejaController.deleteMeja)

module.exports = app