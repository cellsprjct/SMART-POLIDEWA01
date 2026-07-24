const express = require("express");
const fs = require("fs");
const path = require("path");

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

    ][new Date().getDay()];

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

    const sekarang=new Date();

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

        sekarang.getHours()*60+

        sekarang.getMinutes();

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


module.exports=router;