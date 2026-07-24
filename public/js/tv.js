// ======================================
// DIGITAL SIGNAGE TV - POLIDEWA
// ======================================

// ======================================
// SINKRONISASI WAKTU DENGAN SERVER
// ======================================

let timeOffset = 0;
let isTimeSynced = false;

async function syncTimeWithServer() {
    try {
        const start = Date.now();
        const response = await fetch("/api/time", { 
            cache: "no-store",
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        const end = Date.now();
        const data = await response.json();
        
        const serverTime = new Date(data.serverTime).getTime();
        const roundtrip = (end - start) / 2;
        timeOffset = serverTime - (start + roundtrip);
        isTimeSynced = true;
        
        console.log(`✅ Waktu tersinkronisasi dengan server (offset: ${timeOffset}ms)`);
    } catch (err) {
        console.warn("⚠️ Gagal sync waktu, menggunakan waktu lokal", err);
        timeOffset = 0;
        isTimeSynced = false;
    }
}

function getServerTime() {
    return new Date(Date.now() + timeOffset);
}

// ======================================
// JAM & TANGGAL (WITA)
// ======================================

function updateJam() {
    const sekarang = getServerTime();

    // WITA (UTC+8)
    const waktuWita = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(sekarang);

    const tanggalWita = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Makassar",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(sekarang);

    document.getElementById("jam").textContent = waktuWita;
    document.getElementById("tanggal").textContent = tanggalWita;
}

// Jalankan tepat setiap detik
function mulaiJam() {
    updateJam();
    const delay = 1000 - (Date.now() % 1000);
    setTimeout(function sinkron() {
        updateJam();
        setInterval(updateJam, 1000);
    }, delay);
}

// ======================================
// VARIABEL GLOBAL
// ======================================

let semuaData = [];
let daftarRuangan = [];
let indexRuangan = 0;

// ======================================
// LOAD DATA DARI API
// ======================================

async function loadData() {
    try {
        const response = await fetch("/api/jadwal", {
            cache: "no-store"
        });
        semuaData = await response.json();
        
        // Validasi data
        if (!Array.isArray(semuaData)) {
            console.error("Data bukan array:", semuaData);
            semuaData = [];
        }
        
        daftarRuangan = [
            ...new Set(
                semuaData.map(item => item.ruangan || "R.001")
            )
        ];
        
        if (indexRuangan >= daftarRuangan.length) {
            indexRuangan = 0;
        }
        tampilkanRuangan();
    } catch (err) {
        console.error("Gagal mengambil data :", err);
        semuaData = [];
        daftarRuangan = [];
        tampilkanRuangan();
    }
}

// ======================================
// TAMPILKAN RUANGAN AKTIF
// ======================================

function tampilkanRuangan() {
    const roomTitle = document.getElementById("ruanganAktif");
    const tbody = document.getElementById("tbodyJadwal");
    const panel = document.getElementById("kelasSaatIni");

    // Belum ada data
    if (!daftarRuangan || daftarRuangan.length === 0) {
        roomTitle.textContent = "-";
        tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center">
                Tidak ada jadwal hari ini
            </td>
        </tr>
        `;
        panel.innerHTML = `
            <h3>Belum ada kelas berlangsung</h3>
        `;
        return;
    }

    // Ruangan aktif
    const ruangan = daftarRuangan[indexRuangan] || "R.001";
    roomTitle.textContent = ruangan;

    // Filter jadwal berdasarkan ruangan
    const dataRuangan = semuaData.filter(item =>
        item.ruangan === ruangan
    );

    // Tampilkan tabel
    tampilkanTabel(dataRuangan);

    // Tampilkan kelas saat ini
    tampilkanKelasSaatIni(dataRuangan);
}

// ======================================
// TAMPILKAN TABEL JADWAL
// ======================================

function tampilkanTabel(data) {
    const tbody = document.getElementById("tbodyJadwal");
    tbody.innerHTML = "";

    // Jika tidak ada data atau bukan array
    if (!data || !Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center">
                Tidak ada jadwal pada ruangan ini
            </td>
        </tr>
        `;
        return;
    }

    // Urutkan berdasarkan jam mulai
    data.sort((a, b) => {
        const jamA = (a.jam || "08:00").split("-")[0].trim();
        const jamB = (b.jam || "08:00").split("-")[0].trim();
        return jamA.localeCompare(jamB);
    });

    // Isi tabel
    const tampil = data.slice(0, 10);
    tampil.forEach(item => {
        let badge = "";
        let rowClass = "";

        const status = item.status || "Selesai";

        switch (status) {
            case "Berlangsung":
                badge = `
                    <span class="badge badge-green">
                        BERLANGSUNG
                    </span>
                `;
                rowClass = "row-active";
                break;
            case "Belum Mulai":
                badge = `
                    <span class="badge badge-orange">
                        BELUM MULAI
                    </span>
                `;
                break;
            default:
                badge = `
                    <span class="badge badge-gray">
                        SELESAI
                    </span>
                `;
        }

        const waktuTampil = item.jamDisplay || item.jam || "00:00-00:00";
        const matkul = item.matkul || "Mata Kuliah";
        const prodi = item.prodi || "-";
        const dosen = item.dosen || "Dosen";

        tbody.innerHTML += `
    <tr class="${rowClass}">
        <td>
            <strong>${waktuTampil}</strong>
        </td>
        <td>
            <strong>${matkul}</strong>
        </td>
        <td>
            <strong>${prodi}</strong>
        </td>
        <td>
            <strong>${dosen}</strong>
        </td>
        <td>
            ${badge}
        </td>
    </tr>
    `;
    });
}

// ======================================
// PANEL KELAS SAAT INI
// ======================================

function tampilkanKelasSaatIni(data) {
    const panel = document.getElementById("kelasSaatIni");
    
    if (!data || !Array.isArray(data)) {
        panel.innerHTML = `
        <div class="panel-box">
            <i class="fa-solid fa-book-open"></i>
            <div class="panel-text no-class-text">
                <div class="no-class-title">
                    Belum ada kelas berlangsung
                </div>
                <div class="no-class-subtitle">
                    Silakan menunggu jadwal berikutnya
                </div>
            </div>
        </div>
        `;
        return;
    }
    
    const sekarang = data.find(x => x.status === "Berlangsung");

    if (!sekarang) {
        panel.innerHTML = `
        <div class="panel-box">
            <i class="fa-solid fa-book-open"></i>
            <div class="panel-text no-class-text">
                <div class="no-class-title">
                    Belum ada kelas berlangsung
                </div>
                <div class="no-class-subtitle">
                    Silakan menunggu jadwal berikutnya
                </div>
            </div>
        </div>
        <div class="panel-box">
            <i class="fa-regular fa-clock"></i>
            <div>
                <h3>WAKTU</h3>
                <p>-</p>
            </div>
        </div>
        <div class="panel-box">
            <i class="fa-solid fa-user"></i>
            <div>
                <h3>DOSEN</h3>
                <p>-</p>
            </div>
        </div>
        <div class="panel-box">
            <i class="fa-solid fa-building"></i>
            <div>
                <h3>RUANGAN</h3>
                <p>-</p>
            </div>
        </div>
        `;
        return;
    }

    const waktuTampil = sekarang.jamDisplay || sekarang.jam || "00:00-00:00";
    const matkul = sekarang.matkul || "Mata Kuliah";
    const prodi = sekarang.prodi || "-";
    const dosen = sekarang.dosen || "Dosen";
    const ruangan = sekarang.ruangan || "R.001";

    panel.innerHTML = `
    <div class="panel-box">
        <i class="fa-solid fa-book-open"></i>
        <div class="panel-text">
            <div class="panel-value">
                ${matkul}
            </div>
            <div class="panel-label">
                ${prodi}
            </div>
        </div>
    </div>
    <div class="panel-box">
        <i class="fa-regular fa-clock"></i>
        <div class="panel-text">
            <div class="panel-label">
                WAKTU (WITA)
            </div>
            <div class="panel-value">
                ${waktuTampil}
            </div>
        </div>
    </div>
    <div class="panel-box">
        <i class="fa-solid fa-user"></i>
        <div class="panel-text">
            <div class="panel-label">
                DOSEN
            </div>
            <div class="panel-value">
                ${dosen}
            </div>
        </div>
    </div>
    <div class="panel-box">
        <i class="fa-solid fa-building"></i>
        <div class="panel-text">
            <div class="panel-label">
                RUANGAN
            </div>
            <div class="panel-value">
                ${ruangan}
            </div>
        </div>
    </div>
    `;
}

// ======================================
// GANTI RUANGAN OTOMATIS
// ======================================

function nextRoom() {
    if (!daftarRuangan || daftarRuangan.length <= 1) return;
    indexRuangan++;
    if (indexRuangan >= daftarRuangan.length) {
        indexRuangan = 0;
    }
    tampilkanRuangan();
}

// ======================================
// REFRESH DATA DARI SERVER
// ======================================

async function refreshData() {
    try {
        const response = await fetch(
            "/api/jadwal?t=" + Date.now(),
            { cache: "no-store" }
        );
        semuaData = await response.json();
        
        if (!Array.isArray(semuaData)) {
            semuaData = [];
        }
        
        daftarRuangan = [
            ...new Set(
                semuaData.map(item => item.ruangan || "R.001")
            )
        ];
        
        if (indexRuangan >= daftarRuangan.length) {
            indexRuangan = 0;
        }
        tampilkanRuangan();
    } catch (err) {
        console.error(err);
    }
}

// ======================================
// UPDATE STATUS SETIAP MENIT
// ======================================

function updateStatus() {
    if (!semuaData || !Array.isArray(semuaData)) return;
    
    const sekarang = getServerTime();
    const waktuWita = new Date(sekarang.toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
    }));
    
    const menitSekarang = waktuWita.getHours() * 60 + waktuWita.getMinutes();

    semuaData.forEach(item => {
        if (!item.jam) return;
        
        const jamBersih = item.jam.replace(/[.\-\/]/g, ":");
        const waktu = jamBersih.split("-");
        
        if (waktu.length >= 2) {
            const mulai = waktu[0].trim().split(":");
            const selesai = waktu[1].trim().split(":");
            const menitMulai = Number(mulai[0]) * 60 + Number(mulai[1]);
            const menitSelesai = Number(selesai[0]) * 60 + Number(selesai[1]);

            if (menitSekarang < menitMulai) {
                item.status = "Belum Mulai";
            } else if (menitSekarang >= menitMulai && menitSekarang < menitSelesai) {
                item.status = "Berlangsung";
            } else {
                item.status = "Selesai";
            }
        } else {
            item.status = "Selesai";
        }
    });

    tampilkanRuangan();
}

// ======================================
// START
// ======================================

window.addEventListener("load", async () => {
    await syncTimeWithServer();
    mulaiJam();
    await loadData();
    updateStatus();
});

// Update jam setiap detik
setInterval(updateJam, 1000);

// Update status setiap menit
setInterval(updateStatus, 60000);

// Ambil data terbaru dari admin setiap 5 detik
setInterval(refreshData, 5000);

// Ganti ruangan setiap 10 detik
setInterval(nextRoom, 10000);

// Sinkronisasi ulang waktu dengan server setiap 5 menit
setInterval(syncTimeWithServer, 300000);