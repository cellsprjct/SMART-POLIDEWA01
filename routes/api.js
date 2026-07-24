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

    try {
        const data = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Error reading data:", err);
        return [];
    }

}


// ======================================
// HARI SEKARANG (WITA)
// ======================================

function hariSekarang() {

    const sekarang = new Date(new Date().toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
    }));

    return [

        "Minggu",

        "Senin",

        "Selasa",

        "Rabu",

        "Kamis",

        "Jumat",

        "Sabtu"

    ][sekarang.getDay()];

}


// ======================================
// JAM KE MENIT
// ======================================

function jamKeMenit(jam) {

    if (!jam) return 0;
    
    jam = String(jam).replace(/[.\-\/]/g, ":");

    const parts = jam.split(":").map(Number);
    
    if (parts.length >= 2) {
        const jamNum = parts[0] || 0;
        const menitNum = parts[1] || 0;
        return (jamNum * 60) + menitNum;
    }
    
    return 0;

}


// ======================================
// NORMALISASI FORMAT JAM UNTUK TAMPILAN
// ======================================

function normalisasiJam(jam) {

    if (!jam) return "00:00";
    
    jam = String(jam).replace(/[.\-\/]/g, ":");
    
    const parts = jam.split(":").map(Number);
    
    if (parts.length >= 2) {
        const jamStr = String(parts[0] || 0).padStart(2, "0");
        const menitStr = String(parts[1] || 0).padStart(2, "0");
        return `${jamStr}:${menitStr}`;
    }
    
    return jam;

}


// ======================================
// FORMAT JAM UNTUK TAMPILAN
// ======================================

function formatJamTampilan(jam) {

    if (!jam) return "00:00 - 00:00";
    
    jam = String(jam).replace(/[.\-\/]/g, ":");
    
    let parts = jam.split(/\s*[-–—~]\s*/);
    
    if (parts.length < 2) {
        parts = jam.split("-");
    }
    
    if (parts.length < 2) {
        return normalisasiJam(jam.trim());
    }
    
    const mulai = normalisasiJam(parts[0].trim());
    const selesai = normalisasiJam(parts[1].trim());
    
    return `${mulai} - ${selesai}`;

}


// ======================================
// HITUNG STATUS (WITA)
// ======================================

function hitungStatus(hari, jam) {

    if (!hari || !jam) return "Selesai";

    jam = String(jam).replace(/[.\-\/]/g, ":");

    const daftarHari = [

        "Minggu",

        "Senin",

        "Selasa",

        "Rabu",

        "Kamis",

        "Jumat",

        "Sabtu"

    ];

    const sekarang = new Date(new Date().toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
    }));

    const hariIni = hariSekarang();
    const indexHari = daftarHari.indexOf(hari);
    const indexNow = daftarHari.indexOf(hariIni);

    if (indexHari > indexNow) return "Belum Mulai";
    if (indexHari < indexNow) return "Selesai";

    const waktu = jam.split("-");
    
    if (waktu.length < 2) {
        const menitMulai = jamKeMenit(jam);
        const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
        
        if (menitSekarang < menitMulai) return "Belum Mulai";
        if (menitSekarang < menitMulai + 120) return "Berlangsung";
        return "Selesai";
    }

    const mulai = waktu[0].trim();
    const selesai = waktu[1].trim();

    const menitMulai = jamKeMenit(mulai);
    const menitSelesai = jamKeMenit(selesai);
    const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();

    if (menitSekarang < menitMulai) return "Belum Mulai";
    if (menitSekarang >= menitMulai && menitSekarang < menitSelesai) return "Berlangsung";
    return "Selesai";

}


// ======================================
// API JADWAL
// ======================================

router.get("/jadwal", (req, res) => {

    try {
        let jadwal = bacaData();

        // Validasi dan proses data
        jadwal = jadwal.map(item => {
            
            // Pastikan semua field ada
            const hari = item.hari || "Senin";
            const jam = item.jam || "08:00-10:00";
            const matkul = item.matkul || "Mata Kuliah";
            const prodi = item.prodi || "-";
            const dosen = item.dosen || "Dosen";
            const ruangan = item.ruangan || "R.001";
            
            const status = hitungStatus(hari, jam);
            const jamDisplay = formatJamTampilan(jam);
            
            return {
                id: item.id || Date.now() + Math.random(),
                hari: hari,
                jam: jam,
                matkul: matkul,
                prodi: prodi,
                dosen: dosen,
                ruangan: ruangan,
                status: status,
                jamDisplay: jamDisplay,
                indexAsli: jadwal.indexOf(item)
            };
        });

        // hanya hari ini (WITA)
        const hariIni = hariSekarang();

        jadwal = jadwal.filter(

            x => x.hari === hariIni

        );

        // urut jam
        jadwal.sort((a, b) => {

            const jamA = jamKeMenit(

                a.jam

                .replace(/[.\-\/]/g, ":")

                .split("-")[0]

            );

            const jamB = jamKeMenit(

                b.jam

                .replace(/[.\-\/]/g, ":")

                .split("-")[0]

            );

            return jamA - jamB;

        });

        res.json(jadwal);

    } catch (err) {
        console.error("Error in /jadwal:", err);
        res.status(500).json({ error: "Internal server error" });
    }

});


// ======================================
// API ENDPOINT UNTUK SYNC WAKTU (WITA)
// ======================================

router.get("/time", (req, res) => {

    const now = new Date(new Date().toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
    }));

    res.json({
        serverTime: now.toISOString(),
        timezone: "Asia/Makassar (WITA)",
        waktu: {
            jam: String(now.getHours()).padStart(2, "0"),
            menit: String(now.getMinutes()).padStart(2, "0"),
            detik: String(now.getSeconds()).padStart(2, "0")
        },
        tanggal: {
            hari: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()],
            tanggal: now.getDate(),
            bulan: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][now.getMonth()],
            tahun: now.getFullYear()
        }
    });

});


module.exports = router;