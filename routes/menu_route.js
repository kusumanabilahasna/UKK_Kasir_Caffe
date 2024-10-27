const express = require(`express`)
const app = express()

app.use(express.json())

const { authorize } = require(`../controllers/auth_controller`)
const menuController = require(`../controllers/menu_controller`)
const { validateMenu } = require(`../middleware/menu_validation`);
const { IsKasir, IsAdmin, IsManager } = require(`../middleware/role_validation`);


app.get(`/getall`, authorize, menuController.getAllMenu)
app.post(`/filter`,authorize, menuController.filterMenu)
app.post(`/add`, authorize, IsAdmin, menuController.addMenu)
app.put(`/update/:id_menu`, authorize, IsAdmin, menuController.updateMenu)
app.delete(`/delete/:id_menu`,authorize, IsAdmin, menuController.deleteMenu)

module.exports = app