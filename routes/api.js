const express = require("express");
const fs = require("fs");
const path = require("path");

const { getNowMakassar } = require("../utils/ntpTime");

const router = express.Router();

const filePath = path.join(__dirname, "../data/jadwal.json");

// ======================================
// BACA DATA
// ======================================

function bacaData() {

    if (!fs.existsSync(filePath)) {

        fs.writeFileSync(filePath, "[]");

    }

    return JSON.parse(

        fs.readFileSync(filePath, "utf8")

    );

}


// ======================================
// HARI SEKARANG
// ======================================

function hariSekarang() {

    return [

        "Minggu",

        "Senin",

        "Selasa",

        "Rabu",

        "Kamis",

        "Jumat",

        "Sabtu"

    // getUTCDay() dipakai karena getNowMakassar() sudah
    // menggeser waktu ke WITA, bukan timezone OS server
    ][getNowMakassar().getUTCDay()];

}


// ======================================
// JAM KE MENIT
// Mendukung
// 07:30
// 07.30
// ======================================

function jamKeMenit(jam){

    jam = jam.replace(/\./g,":");

    const [j,m] = jam.split(":").map(Number);

    return j*60+m;

}


// ======================================
// HITUNG STATUS
// ======================================

function hitungStatus(hari,jam){

    jam = jam.replace(/\./g,":");

    const daftarHari=[

        "Minggu",

        "Senin",

        "Selasa",

        "Rabu",

        "Kamis",

        "Jumat",

        "Sabtu"

    ];

    const sekarang=getNowMakassar();

    const hariIni=hariSekarang();

    const indexHari=

        daftarHari.indexOf(hari);

    const indexNow=

        daftarHari.indexOf(hariIni);

    // Belum hari

    if(indexHari>indexNow)

        return "Belum Mulai";

    // Hari lewat

    if(indexHari<indexNow)

        return "Selesai";

    const menitSekarang=

        sekarang.getUTCHours()*60+

        sekarang.getUTCMinutes();

    const waktu=jam.split("-");

    const mulai=

        jamKeMenit(waktu[0].trim());

    const selesai=

        jamKeMenit(waktu[1].trim());

    if(menitSekarang<mulai)

        return "Belum Mulai";

    if(

        menitSekarang>=mulai &&

        menitSekarang<selesai

    )

        return "Berlangsung";

    return "Selesai";

}



// ======================================
// API JADWAL
// ======================================

router.get("/jadwal",(req,res)=>{

    let jadwal=bacaData();

    jadwal=jadwal.map(item=>({

        ...item,

        status:hitungStatus(

            item.hari,

            item.jam

        )

    }));

    // hanya hari ini

    const hariIni=hariSekarang();

    jadwal=jadwal.filter(

        x=>x.hari===hariIni

    );

    // urut jam

    jadwal.sort((a,b)=>{

        const jamA=

            jamKeMenit(

                a.jam

                .replace(/\./g,":")

                .split("-")[0]

            );

        const jamB=

            jamKeMenit(

                b.jam

                .replace(/\./g,":")

                .split("-")[0]

            );

        return jamA-jamB;

    });

    res.json(jadwal);

});


// ======================================
// API WAKTU (untuk jam di layar TV)
// Sumbernya sama dengan yang dipakai untuk
// menghitung status jadwal: NTP + WITA
// ======================================

router.get("/waktu",(req,res)=>{

    const namaHari=[

        "Minggu","Senin","Selasa","Rabu",

        "Kamis","Jumat","Sabtu"

    ];

    const namaBulan=[

        "Januari","Februari","Maret","April",

        "Mei","Juni","Juli","Agustus",

        "September","Oktober","November","Desember"

    ];

    const sekarang=getNowMakassar();

    const jam=String(sekarang.getUTCHours()).padStart(2,"0");
    const menit=String(sekarang.getUTCMinutes()).padStart(2,"0");
    const detik=String(sekarang.getUTCSeconds()).padStart(2,"0");

    res.json({

        jam:`${jam}:${menit}:${detik}`,

        tanggal:`${namaHari[sekarang.getUTCDay()]}, `+
            `${sekarang.getUTCDate()} `+
            `${namaBulan[sekarang.getUTCMonth()]} `+
            `${sekarang.getUTCFullYear()}`,

        timestamp:sekarang.getTime()

    });

});


module.exports=router;