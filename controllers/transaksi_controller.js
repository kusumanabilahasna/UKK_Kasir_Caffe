const userModel = require(`../models/index`).user;
const transaksiModel = require(`../models/index`).transaksi;
const detailModel = require(`../models/index`).detail_transaksi;
const menuModel = require(`../models/index`).menu;
const mejaModel = require(`../models/index`).meja;
const { fn, col, literal } = require('sequelize');
const { Op } = require("sequelize");
const fs = require('fs');
const pdf = require('html-pdf');
const path = require('path');
const moment = require('moment');
require('moment/locale/id'); // Untuk menggunakan bahasa Indonesia




exports.getAllTransaksi = async (request, response) => {
  try {
    let result = await transaksiModel.findAll({
      include: [
        "meja",
        "user",
        {
          model: detailModel,
          as: "detail_transaksi",
          include: ["menu"],
        },
      ], order: [
        ["id_transaksi", "DESC"]
      ],
    });
    return response.json({
      status: true,
      data: result,
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

exports.addTransaksi = async (request, response) => {
  try {
    const meja = await mejaModel.findOne({
      where: { id_meja: request.body.id_meja }
    });

    if (!meja) {
      throw new Error(`Meja dengan ID ${request.body.id_meja} tidak ditemukan.`);
    }

    if (meja.status === "terisi") {
      throw new Error(`Meja dengan ID ${request.body.id_meja} sudah terisi, pilih meja lain.`);
    }

    let transaksi = {
      tgl_transaksi: new Date(),
      id_user: request.user.id_user,
      id_meja: request.body.id_meja,
      nama_pelanggan: request.body.nama_pelanggan,
      status: request.body.status,
    };

    let insertTransaksi = await transaksiModel.create(transaksi);

    let transaksiID = insertTransaksi.id_transaksi;
    let arrayDetail = request.body.detail_transaksi;
    for (let i = 0; i < arrayDetail.length; i++) {
      arrayDetail[i].id_transaksi = transaksiID;
      let menu = await menuModel.findOne({
        where: { id_menu: arrayDetail[i].id_menu },
      });
      if (!menu) {
        throw new Error(`Menu dengan ID ${arrayDetail[i].id_menu} tidak ditemukan.`);
      }

      arrayDetail[i].harga = menu?.harga * arrayDetail[i].jumlah;
    }
    await detailModel.bulkCreate(arrayDetail);

    if (transaksi.status === "belum_bayar") {

      await mejaModel.update(
        { status: "terisi" },
        { where: { id_meja: transaksi.id_meja } }
      );
    }
    return response.json({
      status: true,
      insertTransaksi,
      message: "Data transaksi berhasil ditambahkan",
    });
  } catch (error) {
    console.log(error)
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

exports.updateTransaksi = async (request, response) => {
  try {
    const id_transaksi = request.params.id_transaksi;
    const newData = {
      id_meja: request.body.id_meja,
      nama_pelanggan: request.body.nama_pelanggan,
      status: request.body.status,
    };

    const arrayDetail = request.body.detail_transaksi;

    const transaksi = await transaksiModel.findByPk(id_transaksi);
    if (!transaksi) {
      throw new Error("Transaksi not found.");
    }

    const Oldid_meja = transaksi.id_meja;

    const meja = await mejaModel.findOne({
      where: { id_meja: newData.id_meja }
    });

    if (!meja) {
      throw new Error(`Meja dengan ID ${request.body.id_meja} tidak ditemukan.`);
    }

    await transaksiModel.update(newData, {
      where: { id_transaksi },
    });

    if (newData.id_meja != Oldid_meja) {

      if (meja.status === "terisi") {
        throw new Error(`Meja dengan ID ${request.body.id_meja} sudah terisi, pilih meja lain.`);
      }
      // Ubah status meja lama menjadi "kosong"
      await mejaModel.update(
        { status: 'kosong' },
        { where: { id_meja: Oldid_meja } }
      );

      // Ubah status meja baru menjadi "terisi"
      await mejaModel.update(
        { status: 'terisi' },
        { where: { id_meja: newData.id_meja } }
      );
    }

    if (request.body.status === "lunas") {
      const [updated] = await Promise.all([
        mejaModel.update({ status: "kosong" }, { where: { id_meja: newData.id_meja } }),
      ]);

      if (updated[0] === 0) {
        throw new Error("Failed to update meja status.");
      }
    }

    if (arrayDetail && arrayDetail.length > 0) {
      // Hapus semua detail transaksi lama yang terkait dengan id_transaksi ini
      await detailModel.destroy({ where: { id_transaksi } });

      // Menyimpan detail transaksi baru dengan harga yang sesuai
      const updatedDetails = [];

      for (const detail of arrayDetail) {
        // Ambil harga menu berdasarkan id_menu
        const menu = await menuModel.findByPk(detail.id_menu);
        if (!menu) {
          throw new Error(`Menu dengan ID ${detail.id_menu} tidak ditemukan.`);
        }

        // Hitung harga total untuk detail ini
        const hargaDetail = menu.harga * detail.jumlah;

        // Siapkan objek detail transaksi baru
        updatedDetails.push({
          ...detail,
          id_transaksi,
          harga: hargaDetail, // Menyimpan harga total di detail
        });
      }

      // Bulk insert detail transaksi baru
      await detailModel.bulkCreate(updatedDetails, {
        updateOnDuplicate: ['id_detail_transaksi', 'id_menu', 'jumlah', 'harga'], // Sesuaikan kolom-kolom yang perlu di-update
      });
    }

    return response.json({
      status: true,
      message: "Data transaksi berhasil diubah",
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

exports.updatestatus = async (request, response) => {
  try {
    const id_transaksi = request.params.id_transaksi;
    const id_meja = request.body.id_meja;
    const status = request.body.status;

    const transaksi = await transaksiModel.findByPk(id_transaksi);
    const Oldid_meja = transaksi.id_meja;
    // Update the status of the transaction
    await transaksiModel.update({ status }, { where: { id_transaksi } });

    if (id_meja != Oldid_meja) {
      throw new Error("id_meja tidak sama dengan yang lama.");
    }

    if (status === "lunas") {
      // Update the status of the meja to "kosong"
      const [updated] = await mejaModel.update(
        { status: "kosong" },
        { where: { id_meja } }
      );
      if (!updated) {
        throw new Error("Failed to update meja status.");
      }
    }

    if (status === "belum_bayar") {
      // Update the status of the meja to "kosong"
      const [updated] = await mejaModel.update(
        { status: "terisi" },
        { where: { id_meja } }
      );
      if (!updated) {
        throw new Error("Failed to update meja status.");
      }
    }

    return response.json({
      status: true,
      message: "Status transaksi berhasil diperbarui",
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

exports.deleteTransaksi = async (request, response) => {
  try {
    let id_transaksi = request.params.id_transaksi;
    let transakasis = await transaksiModel.findOne({ where: { id_transaksi } });

    await detailModel.destroy({ where: { id_transaksi: id_transaksi } });
    await transaksiModel.destroy({ where: { id_transaksi: id_transaksi } });
    if (transakasis.status === "belum_bayar") {
      await mejaModel.update(
        { status: "kosong" },
        { where: { id_meja: transakasis.id_meja } }
      );
    }
    return response.json({
      status: true,
      message: "Data transaksi berhasil dihapus",
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

// get data transaksi berdasarkan tanggal
exports.getTgl = async (req, res) => {
  const { tgl_awal, tgl_akhir } = req.params;

  try {
    const startDate = new Date(tgl_awal);
    startDate.setHours(0, 0, 0, 0); // Set start time to 00:00:00

    const endDate = new Date(tgl_akhir);
    endDate.setHours(23, 59, 59, 999); // Set end time to 23:59:59.999

    const result = await transaksiModel.findAll({
      where: {
        tgl_transaksi: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        "meja",
        "user",
        {
          model: detailModel,
          as: "detail_transaksi",
          include: ["menu"],
        },
      ],
    });

    if (result.length === 0) {
      res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan",
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "Data ditemukan",
        data: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// get transaksi by id user
exports.getUser = async (req, res) => {
  // endpoint untuk mengambil data transaksi berdasarkan id user
  try {
    const result = await transaksiModel.findAll({
      where: { id_user: req.params.id_user },
      include: ["user", "meja"],
      order: [["id_transaksi", "DESC"]],
    });

    if (result) {
      res.status(200).json({
        status: "success",
        data: result,
      });
    } else {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
// get data transaksi sesuai nama user
exports.getNamaUser = async (req, res) => {
  try {
    const param = { nama_user: req.params.nama_user };
    const userResult = await userModel.findAll({
      where: {
        nama_user: param.nama_user,
      },
    });
    if (userResult.length == null) {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
      return;
    }
    const transaksiResult = await transaksiModel.findAll({
      where: {
        id_user: userResult[0].id_user,
      },
    });
    if (transaksiResult.length === 0) {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      message: "data ditemukan",
      data: transaksiResult,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// mencari total pendapatan berdasarkan tanggal
exports.getPendapatanTgl = async (req, res) => {
  try {
    const param = { tgl_transaksi: req.params.tgl_transaksi };
    const result = await detailModel.findAll({
      attributes: [
        [fn('SUM', col('detail_transaksi.harga')), 'pendapatan']
      ],
      include: [
        {
          model: transaksiModel,
          as: 'transaksi',
          where: {
            tgl_transaksi: {
              [Op.between]: [
                param.tgl_transaksi + " 00:00:00",
                param.tgl_transaksi + " 23:59:59",
              ],
            }
          },
        }
      ],
      group: ['detail_transaksi.id_transaksi']
    })
    res.status(200).json({
      status: "success",
      data: result,
      total_keseluruhan: result.reduce((a, b) => a + parseInt(b.dataValues.pendapatan), 0)
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  };
};
//pendapatan bulan
exports.pendapatanBln = async (req, res) => {
  try {
    // Ambil parameter bulan dari request
    const bulan = req.params.bulan; // Misalnya req.params.bulan untuk mewakili bulan dalam format angka (1-12)

    const result = await detailModel.findAll({
      attributes: [
        [fn('SUM', col('detail_transaksi.harga')), 'pendapatan'] // Menghitung total pendapatan
      ],
      include: [
        {
          model: transaksiModel,
          as: 'transaksi',
          where: literal(`MONTH(tgl_transaksi) = ${bulan}`) // Menggunakan fungsi MONTH di literal
        }
      ],
      group: ['detail_transaksi.id_transaksi'] // Grouping berdasarkan transaksi
    });

    // Menghitung total pendapatan keseluruhan dari hasil query
    const totalPendapatan = result.reduce((acc, curr) => acc + parseInt(curr.dataValues.pendapatan), 0);

    // Mengirim respons
    res.status(200).json({
      status: "success",
      data: result,
      total_keseluruhan: totalPendapatan
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  };
};

exports.notaorder = async (req, res) => {
  try {
    // Ambil data order berdasarkan ID
    const id_transaksi = req.params.id_transaksi;
    const pembayaran = parseInt(req.body.pembayaran) || 0;
    const transaksis = await transaksiModel.findOne({
      where: { id_transaksi: id_transaksi },
      include: [
        {
          model: detailModel,
          as: 'detail_transaksi',
          include: [{
            model: menuModel,
            as: 'menu'
          }]
        }
      ]
    });

    if (!transaksis) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const meja = await mejaModel.findOne({
      where: { id_meja: transaksis.id_meja }
    });

    const user = await userModel.findOne({
      where: { id_user: transaksis.id_user }
    });

    let template = fs.readFileSync(path.join(__dirname, 'template_nota.html'), 'utf-8');
    // Hitung total harga dari detail pesanan
    let total = 0;
    let qtyTotal = 0;
    const details = transaksis.detail_transaksi.map(detail => {
      qtyTotal += detail.jumlah;
      const itemTotal = detail.harga;
      total += itemTotal;
      return `<tr>
                <td>${detail.menu.nama_menu}</td>
                <td class="right-align">${detail.jumlah}</td>
                <td class="right-align">Rp ${detail.menu.harga}</td>
                <td class="right-align">Rp ${itemTotal}</td>
              </tr>`;
    })
      .join('');
    const kembali = pembayaran - total;
    const now = moment(transaksis.tgl_transaksi);
    const tgl_format = now.format('DD-MM-YYYY HH:mm:ss');

    template = template
      .replace('{{id_order}}', transaksis.id_transaksi)
      .replace('{{tgl_order}}', tgl_format)
      .replace('{{nomor_meja}}', meja.nomor_meja)
      .replace('{{nama_pelanggan}}', transaksis.nama_pelanggan)
      .replace('{{nama_kasir}}', user.nama_user)
      .replace('{{Items}}', details)
      .replace('{{Total_Qty}}', qtyTotal)
      .replace('{{Total}}', total)
      .replace('{{Terbayar}}', pembayaran)
      .replace('{{Kembali}}', kembali)


      const options = { format: 'A4', orientation: 'portrait' };

      // Buat file PDF
      pdf.create(template, options).toFile('nota.pdf', (err, result) => {
        if (err) {
          console.error('Error generating PDF:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to generate PDF'
          });
        }
  
        console.log('Nota berhasil dibuat:', result.filename);
  
        // Kirimkan PDF sebagai response
        const pdfPath = path.resolve('nota.pdf');
        res.sendFile(pdfPath, (err) => {
          if (err) {
            console.error('Error sending PDF:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to send PDF'
            });
          }
        });
      });  

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message
    });
  }
};