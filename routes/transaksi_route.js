const express = require(`express`)
const app = express()

app.use(express.json())

const { authorize } = require(`../controllers/auth_controller`)
const transaksiController = require(`../controllers/transaksi_controller`)
const { IsKasir, IsAdmin, IsManager } = require(`../middleware/role_validation`);


app.get(`/getall`, authorize, IsManager, transaksiController.getAllTransaksi)
app.post(`/add`,authorize, IsKasir, transaksiController.addTransaksi)
app.put(`/updtran/:id_transaksi`, authorize, transaksiController.updateTransaksi)
app.put(`/updstat/:id_transaksi`, authorize, IsKasir, transaksiController.updatestatus)
app.delete(`/delete/:id_transaksi`, authorize, transaksiController.deleteTransaksi)
app.get(`/gettgl/:tgl_awal/:tgl_akhir`, authorize, IsManager, transaksiController.getTgl)
app.get(`/getuser/:id_user`, authorize, transaksiController.getUser)
app.get(`/getNamaUser/:nama_user`, authorize, transaksiController.getNamaUser)
app.get(`/getPendapatanTgl/:tgl_transaksi`, authorize, IsManager, transaksiController.getPendapatanTgl)
app.get(`/getpendapatanBln/:bulan`, authorize, IsManager, transaksiController.pendapatanBln)
app.get(`/notaorder/:id_transaksi`, authorize, transaksiController.notaorder)

module.exports = app