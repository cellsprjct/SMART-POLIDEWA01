// ======================================
// DIGITAL SIGNAGE TV - POLIDEWA
// ======================================

// ======================================
// JAM & TANGGAL
// ======================================

// ======================================
// JAM & TANGGAL (NTP + WITA, dari server)
// ======================================
// Jam TIDAK lagi diambil dari jam device/browser (yang bisa
// salah setting/drift), tapi dari endpoint /api/waktu yang
// sumbernya adalah waktu NTP yang sudah dikonversi ke WITA.
// Supaya tidak nge-hit server tiap detik, jam disinkronkan
// tiap 30 detik, lalu di antaranya jalan "menghitung sendiri"
// (tick lokal) berbasis selisih dari waktu server terakhir.

let waktuServerMs = null;   // waktu server (ms) saat sinkron terakhir
let waktuLokalSaatSync = null; // Date.now() lokal saat sinkron terakhir

async function syncWaktuServer() {

    try {

        const response = await fetch("/api/waktu", { cache: "no-store" });

        const data = await response.json();

        waktuServerMs = data.timestamp;

        waktuLokalSaatSync = Date.now();

    } catch (err) {

        console.error("Gagal sinkron jam server:", err);

    }

}

function renderJamTanggal() {

    if (waktuServerMs === null) return;

    // Estimasi waktu sekarang = waktu server terakhir + selisih lokal
    const estimasiMs = waktuServerMs + (Date.now() - waktuLokalSaatSync);

    const sekarang = new Date(estimasiMs);

    const jam = String(sekarang.getUTCHours()).padStart(2, "0");
    const menit = String(sekarang.getUTCMinutes()).padStart(2, "0");
    const detik = String(sekarang.getUTCSeconds()).padStart(2, "0");

    const namaHari = [
        "Minggu", "Senin", "Selasa", "Rabu",
        "Kamis", "Jumat", "Sabtu"
    ];

    const namaBulan = [
        "Januari", "Februari", "Maret", "April",
        "Mei", "Juni", "Juli", "Agustus",
        "September", "Oktober", "November", "Desember"
    ];

    document.getElementById("jam").textContent = `${jam}:${menit}:${detik}`;

    document.getElementById("tanggal").textContent =
        `${namaHari[sekarang.getUTCDay()]}, ${sekarang.getUTCDate()} ` +
        `${namaBulan[sekarang.getUTCMonth()]} ${sekarang.getUTCFullYear()}`;

}

function mulaiJam() {

    syncWaktuServer().then(renderJamTanggal);

    // Tick tampilan tiap detik (halus di layar)
    setInterval(renderJamTanggal, 1000);

    // Sinkron ulang ke server tiap 30 detik (bukan tiap detik)
    setInterval(syncWaktuServer, 30000);

}

mulaiJam();

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

    }

    catch (err) {

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
    const tampil = data.slice(0,10);

    tampil.forEach(item=>{

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

    tbody.innerHTML += `
    <tr class="${rowClass}">

        <td>
            <strong>${item.jam}</strong>
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

function tampilkanKelasSaatIni(data){

    const panel=document.getElementById("kelasSaatIni");

    const sekarang=data.find(x=>x.status==="Berlangsung");

    if(!sekarang){

        panel.innerHTML=`

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

    panel.innerHTML=`

    <div class="panel-box">

        <i class="fa-solid fa-book-open"></i>

        <div class="panel-text">

            <div class="panel-value">
                ${sekarang.matkul}
            </div>

            <div class="panel-label">
                ${sekarang.prodi}
            </div>

        </div>

    </div>

    <div class="panel-box">

        <i class="fa-regular fa-clock"></i>

        <div class="panel-text">

            <div class="panel-label">
                WAKTU
            </div>

            <div class="panel-value">
                ${sekarang.jam}
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

            {

                cache: "no-store"

            }

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

    }

    catch (err) {

        console.error(err);

    }

}


// Catatan: status ("Berlangsung"/"Belum Mulai"/"Selesai") TIDAK
// dihitung ulang di client. Status sudah dihitung dengan benar
// di server (routes/api.js) berbasis waktu NTP + WITA, lalu
// dikirim sebagai field "status" pada tiap item dari /api/jadwal.
// Menghitung ulang di client berisiko salah karena memakai jam
// device browser yang timezone/akurasinya tidak terjamin.


// ======================================
// START
// ======================================

window.addEventListener("load", () => {

    loadData();

});


// Ambil data terbaru dari server (status di dalamnya sudah
// dihitung server pakai NTP+WITA). Cukup tiap 15 detik,
// tidak perlu tiap detik.
setInterval(refreshData, 15000);

// Ganti ruangan
setInterval(nextRoom, 10000);