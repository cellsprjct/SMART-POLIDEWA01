const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const filePath = path.join(__dirname, "../data/jadwal.json");

// ======================================================
// BACA DATA
// ======================================================

function bacaData() {

    try {

        if (!fs.existsSync(filePath)) {

            fs.writeFileSync(filePath, "[]");

        }

        return JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

    } catch (err) {

        console.error(err);

        return [];

    }

}

// ======================================================
// SIMPAN DATA
// ======================================================

function simpanData(data) {

    fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2)
    );

}

// ======================================================
// DAFTAR HARI
// ======================================================

const daftarHari = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"
];

const urutanHari = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu"
];

// ======================================================
// HARI SEKARANG
// ======================================================

function getHariSekarang() {

    return daftarHari[new Date().getDay()];

}

// ======================================================
// KONVERSI JAM KE MENIT
// ======================================================

function jamKeMenit(jam) {

    jam = String(jam)
        .trim()
        .replace(/\./g, ":");

    const bagian = jam.split(":");

    if (bagian.length !== 2) {

        return 0;

    }

    const jamInt = parseInt(bagian[0], 10);
    const menitInt = parseInt(bagian[1], 10);

    return (jamInt * 60) + menitInt;

}

// ======================================================
// VALIDASI FORMAT JAM
// contoh:
// 07:30-09:30
// 07.30-09.30
// ======================================================

function validJam(jam) {

    jam = String(jam)
        .trim()
        .replace(/\./g, ":")
        .replace(/\s*-\s*/g, "-");

    const regex =
        /^([01]?\d|2[0-3]):([0-5]\d)-([01]?\d|2[0-3]):([0-5]\d)$/;

    return regex.test(jam);

}

// ======================================================
// VALIDASI JAM MULAI DAN SELESAI
// ======================================================

function cekJamValid(jam) {

    jam = String(jam)
        .trim()
        .replace(/\./g, ":")
        .replace(/\s*-\s*/g, "-");

    const pecah = jam.split("-");

    if (pecah.length !== 2) {

        return false;

    }

    const mulai = jamKeMenit(pecah[0]);

    const selesai = jamKeMenit(pecah[1]);

    return mulai < selesai;

}

// ======================================================
// HITUNG STATUS
// ======================================================

function hitungStatus(hari, jam) {

    if (!hari || !jam) {

        return "Belum Mulai";

    }

    jam = jam
        .replace(/\./g, ":")
        .replace(/\s*-\s*/g, "-");

    const indexHariData =
        daftarHari.indexOf(hari);

    const indexHariSekarang =
        daftarHari.indexOf(getHariSekarang());

    if (indexHariData > indexHariSekarang) {

        return "Belum Mulai";

    }

    if (indexHariData < indexHariSekarang) {

        return "Selesai";

    }

    const sekarang = new Date();

    const menitSekarang =
        sekarang.getHours() * 60 +
        sekarang.getMinutes();

    const waktu = jam.split("-");

    const mulai =
        jamKeMenit(waktu[0]);

    const selesai =
        jamKeMenit(waktu[1]);

    if (menitSekarang < mulai) {

        return "Belum Mulai";

    }

    if (
        menitSekarang >= mulai &&
        menitSekarang < selesai
    ) {

        return "Berlangsung";

    }

    return "Selesai";

}

// ======================================================
// REFRESH STATUS SEMUA DATA
// ======================================================

function refreshStatusSemua() {

    const jadwal = bacaData();

    let berubah = false;

    jadwal.forEach(item => {

        const statusBaru =
            hitungStatus(
                item.hari,
                item.jam
            );

        if (item.status !== statusBaru) {

            item.status = statusBaru;

            berubah = true;

        }

    });

    if (berubah) {

        simpanData(jadwal);

    }

}

// ======================================================
// CEK BENTROK RUANGAN
// ======================================================

function bentrokJadwal(dataBaru, semuaData, indexEdit = null) {

    const mulaiBaru =
        jamKeMenit(
            dataBaru.jam.split("-")[0]
        );

    const selesaiBaru =
        jamKeMenit(
            dataBaru.jam.split("-")[1]
        );

    for (let i = 0; i < semuaData.length; i++) {

        if (i === indexEdit) {

            continue;

        }

        const item = semuaData[i];

        if (item.hari !== dataBaru.hari) {

            continue;

        }

        if (item.ruangan !== dataBaru.ruangan) {

            continue;

        }

        const mulaiLama =
            jamKeMenit(
                item.jam.split("-")[0]
            );

        const selesaiLama =
            jamKeMenit(
                item.jam.split("-")[1]
            );

        if (
            mulaiBaru < selesaiLama &&
            selesaiBaru > mulaiLama
        ) {

            return true;

        }

    }

    return false;

}

// ======================================================
// DASHBOARD ADMIN
// ======================================================

router.get("/", (req, res) => {

    refreshStatusSemua();

    let jadwal = bacaData().map((item, index) => ({
        ...item,
        indexAsli: index
    }));

    jadwal.sort((a, b) => {

        const hariA = urutanHari.indexOf(a.hari);
        const hariB = urutanHari.indexOf(b.hari);

        if (hariA !== hariB) {

            return hariA - hariB;

        }

        const jamA = jamKeMenit(
            a.jam
                .replace(/\./g, ":")
                .split("-")[0]
                .trim()
        );

        const jamB = jamKeMenit(
            b.jam
                .replace(/\./g, ":")
                .split("-")[0]
                .trim()
        );

        return jamA - jamB;

    });

    res.render("dashboard", {

        jadwal,

        totalJadwal: jadwal.length,

        totalDosen:
            [...new Set(jadwal.map(x => x.dosen))].length,

        totalRuangan:
            [...new Set(jadwal.map(x => x.ruangan))].length,

        totalProdi:
            [...new Set(jadwal.map(x => x.prodi))].length

    });

});


// ======================================================
// FORM TAMBAH
// ======================================================

router.get("/tambah", (req, res) => {

    res.render("tambah");

});


// ======================================================
// SIMPAN DATA BARU
// ======================================================

router.post("/tambah", (req, res) => {

    let {

        hari,
        jam,
        matkul,
        prodi,
        dosen,
        ruangan

    } = req.body;

    hari = (hari || "").trim();

    jam = (jam || "")
        .trim()
        .replace(/\./g, ":")
        .replace(/\s*-\s*/g, "-");

    matkul = (matkul || "").trim();

    prodi = (prodi || "").trim();

    dosen = (dosen || "").trim();

    ruangan = (ruangan || "").trim();


    // ===========================================
    // VALIDASI DATA KOSONG
    // ===========================================

    if (

        !hari ||
        !jam ||
        !matkul ||
        !prodi ||
        !dosen ||
        !ruangan

    ) {

        return res.send(

            "<h2>Semua data wajib diisi.</h2>"

        );

    }


    // ===========================================
    // VALIDASI FORMAT JAM
    // ===========================================

    if (!validJam(jam)) {

        return res.send(

            "<h2>Format jam salah.<br>Contoh : 07:30-09:30</h2>"

        );

    }


    // ===========================================
    // VALIDASI JAM
    // ===========================================

    if (!cekJamValid(jam)) {

        return res.send(

            "<h2>Jam selesai harus lebih besar dari jam mulai.</h2>"

        );

    }


    const jadwal = bacaData();


    // ===========================================
    // CEK BENTROK RUANGAN
    // ===========================================

    if (

        bentrokJadwal(

            {

                hari,

                jam,

                ruangan

            },

            jadwal

        )

    ) {

        return res.send(

            "<h2>Ruangan sudah digunakan pada jam tersebut.</h2>"

        );

    }


    // ===========================================
    // SIMPAN DATA
    // ===========================================

    jadwal.push({

        hari,

        jam,

        matkul,

        prodi,

        dosen,

        ruangan,

        status: hitungStatus(hari, jam)

    });


    simpanData(jadwal);


    res.redirect("/admin");

});

// ======================================================
// FORM EDIT
// ======================================================

router.get("/edit/:index", (req, res) => {

    const index = Number(req.params.index);

    const jadwal = bacaData();

    if (

        isNaN(index) ||
        index < 0 ||
        index >= jadwal.length

    ) {

        return res.send("<h2>Data tidak ditemukan.</h2>");

    }

    res.render("edit", {

        data: jadwal[index],

        index

    });

});


// ======================================================
// UPDATE DATA JADWAL
// ======================================================

router.post("/edit/:index", (req, res) => {

    const index = Number(req.params.index);

    const jadwal = bacaData();

    if (

        isNaN(index) ||
        index < 0 ||
        index >= jadwal.length

    ) {

        return res.send("<h2>Data tidak ditemukan.</h2>");

    }

    let {

        hari,
        jam,
        matkul,
        prodi,
        dosen,
        ruangan

    } = req.body;

    hari = (hari || "").trim();

    jam = (jam || "")
        .trim()
        .replace(/\./g, ":")
        .replace(/\s*-\s*/g, "-");

    matkul = (matkul || "").trim();

    prodi = (prodi || "").trim();

    dosen = (dosen || "").trim();

    ruangan = (ruangan || "").trim();


    // ===========================================
    // VALIDASI FIELD
    // ===========================================

    if (

        !hari ||
        !jam ||
        !matkul ||
        !prodi ||
        !dosen ||
        !ruangan

    ) {

        return res.send("<h2>Semua data wajib diisi.</h2>");

    }


    // ===========================================
    // VALIDASI FORMAT JAM
    // ===========================================

    if (!validJam(jam)) {

        return res.send(

            "<h2>Format jam salah.<br>Contoh : 07:30-09:30</h2>"

        );

    }


    // ===========================================
    // VALIDASI JAM
    // ===========================================

    if (!cekJamValid(jam)) {

        return res.send(

            "<h2>Jam selesai harus lebih besar dari jam mulai.</h2>"

        );

    }


    // ===========================================
    // CEK BENTROK
    // ===========================================

    if (

        bentrokJadwal(

            {

                hari,

                jam,

                ruangan

            },

            jadwal,

            index

        )

    ) {

        return res.send(

            "<h2>Ruangan sudah dipakai pada jam tersebut.</h2>"

        );

    }


    // ===========================================
    // UPDATE DATA
    // ===========================================

    jadwal[index] = {

        ...jadwal[index],

        hari,

        jam,

        matkul,

        prodi,

        dosen,

        ruangan,

        status: hitungStatus(hari, jam)

    };


    // ===========================================
    // SIMPAN
    // ===========================================

    simpanData(jadwal);


    res.redirect("/admin");

});

// ======================================================
// HAPUS DATA JADWAL
// ======================================================

router.get("/hapus/:index", (req, res) => {

    const index = Number(req.params.index);

    const jadwal = bacaData();

    if (

        isNaN(index) ||
        index < 0 ||
        index >= jadwal.length

    ) {

        return res.redirect("/admin");

    }

    jadwal.splice(index, 1);

    simpanData(jadwal);

    res.redirect("/admin");

});


// ======================================================
// REFRESH STATUS MANUAL
// ======================================================

router.get("/refresh-status", (req, res) => {

    refreshStatusSemua();

    res.json({

        success: true,

        message: "Status berhasil diperbarui."

    });

});


// ======================================================
// API DATA JADWAL
// ======================================================

router.get("/status", (req, res) => {

    refreshStatusSemua();

    res.json(

        bacaData()

    );

});


// ======================================================
// AUTO REFRESH STATUS SETIAP 30 DETIK
// ======================================================

setInterval(() => {

    refreshStatusSemua();

}, 30000);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;