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
        daftarRuangan = [
            ...new Set(
                semuaData.map(item => item.ruangan)
            )
        ];
        if (indexRuangan >= daftarRuangan.length) {
            indexRuangan = 0;
        }
        tampilkanRuangan();
    } catch (err) {
        console.error("Gagal mengambil data :", err);
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
    if (daftarRuangan.length === 0) {
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
    const ruangan = daftarRuangan[indexRuangan];
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

    // Jika tidak ada jadwal
    if (data.length === 0) {
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
        const jamA = a.jam.split("-")[0].trim();
        const jamB = b.jam.split("-")[0].trim();
        return jamA.localeCompare(jamB);
    });

    // Isi tabel
    const tampil = data.slice(0, 10);
    tampil.forEach(item => {
        let badge = "";
        let rowClass = "";

        switch (item.status) {
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

        // 🔥 PERBAIKAN: Gunakan jamDisplay jika ada, fallback ke jam
        const waktuTampil = item.jamDisplay || item.jam;

        tbody.innerHTML += `
    <tr class="${rowClass}">
        <td>
            <strong>${waktuTampil}</strong>
        </td>
        <td>
            <strong>${item.matkul}</strong>
        </td>
        <td>
            <strong>${item.prodi || "-"}</strong>
        </td>
        <td>
            <strong>${item.dosen}</strong>
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

    // 🔥 PERBAIKAN: Gunakan jamDisplay jika ada, fallback ke jam
    const waktuTampil = sekarang.jamDisplay || sekarang.jam;

    panel.innerHTML = `
    <div class="panel-box">
        <i class="fa-solid fa-book-open"></i>
        <div class="panel-text">
            <div class="panel-value">
                ${sekarang.matkul}
            </div>
            <div class="panel-label">
                ${sekarang.prodi || "-"}
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
                ${sekarang.dosen}
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
                ${sekarang.ruangan}
            </div>
        </div>
    </div>
    `;
}

// ======================================
// GANTI RUANGAN OTOMATIS
// ======================================

function nextRoom() {
    if (daftarRuangan.length <= 1) return;
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
        daftarRuangan = [
            ...new Set(
                semuaData.map(item => item.ruangan)
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
    const sekarang = getServerTime();
    const menitSekarang = sekarang.getHours() * 60 + sekarang.getMinutes();

    semuaData.forEach(item => {
        // Normalisasi format jam untuk konsistensi
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
            // Jika format tidak sesuai
            item.status = "Selesai";
        }
    });

    tampilkanRuangan();
}

// ======================================
// START
// ======================================

window.addEventListener("load", async () => {
    // Sinkronisasi waktu dengan server terlebih dahulu
    await syncTimeWithServer();
    
    // Mulai jam setelah sync
    mulaiJam();
    
    // Load data jadwal
    await loadData();
    
    // Update status pertama kali
    updateStatus();
});

// Update jam setiap detik (sudah dihandle oleh mulaiJam)
// Update status setiap menit (60000 ms)
setInterval(updateStatus, 60000);

// Ambil data terbaru dari admin setiap 5 detik
setInterval(refreshData, 5000);

// Ganti ruangan setiap 10 detik
setInterval(nextRoom, 10000);

// Sinkronisasi ulang waktu dengan server setiap 5 menit (300000 ms)
setInterval(syncTimeWithServer, 1000);