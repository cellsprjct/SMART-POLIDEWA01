const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();

const filePath = path.join(__dirname, "../data/jadwal.json");
const runningTextPath = path.join(__dirname, "../data/running.txt");
const slideshowPath = path.join(__dirname, "../data/slideshow.json");
const uploadDir = path.join(__dirname, "../public/uploads");

// ======================================
// PASTIKAN FOLDER UPLOAD ADA
// ======================================

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ======================================
// KONFIGURASI MULTER (UPLOAD FILE)
// ======================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'slide-' + uniqueSuffix + ext);
    }
});

const fileFilter = function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }
});

// ======================================
// BACA DATA JADWAL
// ======================================

function bacaData() {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "[]");
            return [];
        }
        const data = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Error membaca data:", err);
        return [];
    }
}

// ======================================
// SIMPAN DATA JADWAL
// ======================================

function simpanData(data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error("Error menyimpan data:", err);
    }
}

// ======================================
// BACA RUNNING TEXT
// ======================================

function bacaRunningText() {
    try {
        if (!fs.existsSync(runningTextPath)) {
            const defaultText = "SELAMAT DATANG DI POLITEKNIK DEWANTARA • INFORMASI AKADEMIK DITAMPILKAN SECARA REALTIME • SEMOGA HARI ANDA MENYENANGKAN • SMART POLIDEWA";
            fs.writeFileSync(runningTextPath, defaultText, "utf8");
            return defaultText;
        }
        return fs.readFileSync(runningTextPath, "utf8");
    } catch (err) {
        console.error("Error membaca running text:", err);
        return "";
    }
}

// ======================================
// SIMPAN RUNNING TEXT
// ======================================

function simpanRunningText(text) {
    try {
        fs.writeFileSync(runningTextPath, text, "utf8");
    } catch (err) {
        console.error("Error menyimpan running text:", err);
    }
}

// ======================================
// BACA SLIDESHOW
// ======================================

function bacaSlideshow() {
    try {
        if (!fs.existsSync(slideshowPath)) {
            fs.writeFileSync(slideshowPath, JSON.stringify([], null, 2));
            return [];
        }
        return JSON.parse(fs.readFileSync(slideshowPath, "utf8"));
    } catch (err) {
        console.error("Error membaca slideshow:", err);
        return [];
    }
}

// ======================================
// SIMPAN SLIDESHOW
// ======================================

function simpanSlideshow(data) {
    try {
        fs.writeFileSync(slideshowPath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error("Error menyimpan slideshow:", err);
    }
}

// ======================================
// GET WITA TIME
// ======================================

function getWITATime() {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
    }));
}

// ======================================
// HARI SEKARANG (WITA)
// ======================================

function hariSekarang() {
    const sekarang = getWITATime();
    return ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][sekarang.getDay()];
}

// ======================================
// JAM KE MENIT
// ======================================

function jamKeMenit(jam) {
    if (!jam) return 0;
    jam = String(jam).replace(/[.\-\/]/g, ":");
    const parts = jam.split(":").map(Number);
    if (parts.length >= 2) {
        return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
    return 0;
}

// ======================================
// NORMALISASI FORMAT JAM
// ======================================

function normalisasiJam(jam) {
    if (!jam) return "00:00";
    jam = String(jam).replace(/[.\-\/]/g, ":");
    const parts = jam.split(":").map(Number);
    if (parts.length >= 2) {
        return String(parts[0] || 0).padStart(2, "0") + ":" + String(parts[1] || 0).padStart(2, "0");
    }
    return "00:00-00:00";
}

// ======================================
// FORMAT JAM TAMPILAN
// ======================================

function formatJamTampilan(jam) {
    if (!jam) return jam;
    jam = String(jam).trim();
    if (jam.indexOf("-") === -1) return jam;
    var parts = jam.split("-");
    if (parts.length < 2) return jam;
    var mulai = normalisasiJam(parts[0].trim());
    var selesai = normalisasiJam(parts[1].trim());
    return mulai + " - " + selesai;
}

// ======================================
// HITUNG STATUS (WITA)
// ======================================

function hitungStatus(hari, jam) {
    if (!hari || !jam) return "Selesai";
    jam = String(jam).replace(/[.\-\/]/g, ":");
    const daftarHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const sekarang = getWITATime();
    const hariIni = daftarHari[sekarang.getDay()];
    const indexHari = daftarHari.indexOf(hari);
    const indexNow = daftarHari.indexOf(hariIni);
    
    if (indexHari > indexNow) return "Belum Mulai";
    if (indexHari < indexNow) return "Selesai";
    
    const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();
    const waktu = jam.split("-");
    
    if (waktu.length < 2) {
        const menitMulai = jamKeMenit(jam);
        if (menitSekarang < menitMulai) return "Belum Mulai";
        if (menitSekarang < menitMulai + 120) return "Berlangsung";
        return "Selesai";
    }
    
    const menitMulai = jamKeMenit(waktu[0].trim());
    const menitSelesai = jamKeMenit(waktu[1].trim());
    
    if (menitSekarang < menitMulai) return "Belum Mulai";
    if (menitSekarang >= menitMulai && menitSekarang < menitSelesai) return "Berlangsung";
    return "Selesai";
}

// ======================================
// VALIDASI FORMAT JAM
// ======================================

function validJam(jam) {
    if (!jam) return false;
    jam = String(jam).trim();
    jam = jam.replace(/[.\-\/]/g, ":");
    jam = jam.replace(/\s*-\s*/g, "-");
    var regex = /^([01]?\d|2[0-3]):([0-5]\d)-([01]?\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(jam)) return false;
    var parts = jam.split("-");
    var menitMulai = jamKeMenit(parts[0].trim());
    var menitSelesai = jamKeMenit(parts[1].trim());
    return menitMulai < menitSelesai;
}

// ======================================
// DASHBOARD ADMIN
// ======================================

router.get("/", function(req, res) {
    try {
        var jadwal = bacaData();
        jadwal = jadwal.map(function(item, index) {
            return {
                ...item,
                status: hitungStatus(item.hari, item.jam),
                jamDisplay: formatJamTampilan(item.jam),
                indexAsli: index
            };
        });

        var urutanHari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
        jadwal.sort(function(a, b) {
            var hariA = urutanHari.indexOf(a.hari);
            var hariB = urutanHari.indexOf(b.hari);
            if (hariA !== hariB) return hariA - hariB;
            return jamKeMenit(a.jam.split("-")[0].trim()) - jamKeMenit(b.jam.split("-")[0].trim());
        });

        var runningText = bacaRunningText();
        var slideshow = bacaSlideshow();

        res.render("dashboard", {
            jadwal: jadwal,
            runningText: runningText,
            slideshow: slideshow
        });
    } catch (err) {
        console.error("Error dashboard:", err);
        res.status(500).send("<h2>Error: " + err.message + "</h2>");
    }
});

// ======================================
// API SLIDESHOW
// ======================================

router.get("/api/slideshow", function(req, res) {
    try {
        var slideshow = bacaSlideshow();
        res.json({ slideshow: slideshow });
    } catch (err) {
        res.status(500).json({ error: "Gagal membaca slideshow" });
    }
});

router.post("/api/slideshow", upload.single('file'), function(req, res) {
    try {
        var file = req.file;
        if (!file) {
            return res.status(400).json({ error: "File tidak boleh kosong" });
        }
        var slideshow = bacaSlideshow();
        var newSlide = {
            id: Date.now(),
            title: file.originalname,
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: "/uploads/" + file.filename,
            type: file.mimetype.startsWith('video/') ? 'video' : 'image',
            uploadedAt: new Date().toISOString()
        };
        slideshow.push(newSlide);
        simpanSlideshow(slideshow);
        res.json({ success: true, slide: newSlide });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal menambahkan slide: " + err.message });
    }
});

router.delete("/api/slideshow/:id", function(req, res) {
    try {
        var id = parseInt(req.params.id);
        var slideshow = bacaSlideshow();
        var slide = slideshow.find(function(s) { return s.id === id; });
        if (slide) {
            var filePath = path.join(uploadDir, slide.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        slideshow = slideshow.filter(function(s) { return s.id !== id; });
        simpanSlideshow(slideshow);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Gagal menghapus slide" });
    }
});

// ======================================
// API RUNNING TEXT
// ======================================

router.get("/api/running-text", function(req, res) {
    try {
        var text = bacaRunningText();
        res.json({ text: text });
    } catch (err) {
        res.status(500).json({ error: "Gagal membaca running text" });
    }
});

router.post("/api/running-text", function(req, res) {
    try {
        var text = req.body.text;
        if (!text || text.trim() === "") {
            return res.status(400).json({ error: "Text tidak boleh kosong" });
        }
        simpanRunningText(text.trim());
        res.json({ success: true, text: text.trim() });
    } catch (err) {
        res.status(500).json({ error: "Gagal menyimpan running text" });
    }
});

// ======================================
// API JADWAL UNTUK TV
// ======================================

router.get("/api/jadwal", function(req, res) {
    try {
        var jadwal = bacaData();
        jadwal = jadwal.map(function(item, index) {
            return {
                ...item,
                status: hitungStatus(item.hari, item.jam),
                jamDisplay: formatJamTampilan(item.jam),
                indexAsli: index
            };
        });
        var hariIni = hariSekarang();
        jadwal = jadwal.filter(function(x) { return x.hari === hariIni; });
        jadwal.sort(function(a, b) {
            return jamKeMenit(a.jam.split("-")[0].trim()) - jamKeMenit(b.jam.split("-")[0].trim());
        });
        res.json(jadwal);
    } catch (err) {
        console.error("Error api jadwal:", err);
        res.status(500).json({ error: "Gagal mengambil data" });
    }
});

// ======================================
// TAMBAH JADWAL
// ======================================

router.get("/tambah", function(req, res) {
    try {
        res.render("tambah");
    } catch (err) {
        res.send("<h2>Error: " + err.message + "</h2>");
    }
});

router.post("/tambah", function(req, res) {
    try {
        var hari = (req.body.hari || "").trim();
        var jam = (req.body.jam || "").trim();
        var matkul = (req.body.matkul || "").trim();
        var prodi = (req.body.prodi || "").trim();
        var dosen = (req.body.dosen || "").trim();
        var ruangan = (req.body.ruangan || "").trim();

        if (!hari || !jam || !matkul || !dosen || !ruangan) {
            return res.send("<h2>Semua data wajib diisi.</h2>");
        }

        // 🔥 VALIDASI JAM - FLEKSIBEL
        var jamValid = false;
        var jamClean = jam;
        
        // Coba dengan berbagai format
        var testJam = jam.replace(/[.\-\/]/g, ":").replace(/\s*-\s*/g, "-");
        var regex = /^([01]?\d|2[0-3]):([0-5]\d)-([01]?\d|2[0-3]):([0-5]\d)$/;
        
        if (regex.test(testJam)) {
            var parts = testJam.split("-");
            var menitMulai = jamKeMenit(parts[0].trim());
            var menitSelesai = jamKeMenit(parts[1].trim());
            if (menitMulai < menitSelesai) {
                jamValid = true;
                jamClean = testJam;
            }
        }

        var jadwal = bacaData();
        jadwal.push({
            hari: hari,
            jam: jamClean,
            matkul: matkul,
            prodi: prodi || "-",
            dosen: dosen,
            ruangan: ruangan,
            status: hitungStatus(hari, jamClean)
        });
        simpanData(jadwal);
        
        res.redirect("/admin");
    } catch (err) {
        console.error("Error tambah:", err);
        res.send("<h2>Error: " + err.message + "</h2>");
    }
});

// ======================================
// EDIT JADWAL - Menggunakan Index
// ======================================

router.get("/edit/:index", function(req, res) {
    try {
        var index = parseInt(req.params.index);
        var jadwal = bacaData();
        
        if (isNaN(index) || index < 0 || index >= jadwal.length) {
            return res.status(404).send("<h2>Data tidak ditemukan.</h2>");
        }
        
        var item = jadwal[index];
        
        res.render("edit", { 
            data: item, 
            index: index
        });
    } catch (err) {
        console.error("Error edit:", err);
        res.status(500).send("<h2>Error: " + err.message + "</h2>");
    }
});

router.post("/edit/:index", function(req, res) {
    try {
        var index = parseInt(req.params.index);
        var hari = (req.body.hari || "").trim();
        var jam = (req.body.jam || "").trim();
        var matkul = (req.body.matkul || "").trim();
        var prodi = (req.body.prodi || "").trim();
        var dosen = (req.body.dosen || "").trim();
        var ruangan = (req.body.ruangan || "").trim();

        if (!hari || !jam || !matkul || !dosen || !ruangan) {
            return res.send("<h2>Semua data wajib diisi.</h2>");
        }

        // Validasi jam
        var testJam = jam.replace(/[.\-\/]/g, ":").replace(/\s*-\s*/g, "-");
        var regex = /^([01]?\d|2[0-3]):([0-5]\d)-([01]?\d|2[0-3]):([0-5]\d)$/;
        
        if (!regex.test(testJam)) {
            return res.send("<h2>Format jam salah.<br>Contoh: 07:30-09:30 atau 07.30-09.30</h2>");
        }

        var jadwal = bacaData();
        
        if (isNaN(index) || index < 0 || index >= jadwal.length) {
            return res.send("<h2>Data tidak ditemukan.</h2>");
        }

        jadwal[index] = {
            ...jadwal[index],
            hari: hari,
            jam: testJam,
            matkul: matkul,
            prodi: prodi || "-",
            dosen: dosen,
            ruangan: ruangan,
            status: hitungStatus(hari, testJam)
        };

        simpanData(jadwal);
        res.redirect("/admin");
    } catch (err) {
        console.error("Error update:", err);
        res.send("<h2>Error: " + err.message + "</h2>");
    }
});

// ======================================
// HAPUS JADWAL
// ======================================

router.get("/hapus/:index", function(req, res) {
    try {
        var index = parseInt(req.params.index);
        var jadwal = bacaData();
        
        if (isNaN(index) || index < 0 || index >= jadwal.length) {
            return res.redirect("/admin");
        }

        jadwal.splice(index, 1);
        simpanData(jadwal);
        res.redirect("/admin");
    } catch (err) {
        console.error("Error hapus:", err);
        res.send("<h2>Error: " + err.message + "</h2>");
    }
});

// ======================================
// CREATE DATA FOLDER
// ======================================

var dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(runningTextPath)) {
    fs.writeFileSync(runningTextPath, "SELAMAT DATANG DI POLITEKNIK DEWANTARA • INFORMASI AKADEMIK DITAMPILKAN SECARA REALTIME • SEMOGA HARI ANDA MENYENANGKAN • SMART POLIDEWA", "utf8");
}
if (!fs.existsSync(slideshowPath)) {
    fs.writeFileSync(slideshowPath, JSON.stringify([], null, 2));
}

module.exports = router;