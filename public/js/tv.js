// ======================================
// DIGITAL SIGNAGE TV - POLIDEWA
// ======================================

// ======================================
// JAM & TANGGAL
// ======================================

// ======================================
// JAM & TANGGAL (WITA)
// ======================================

function updateJam() {

    const sekarang = new Date();

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
updateJam();

function mulaiJam() {

    updateJam();

    const delay = 1000 - (Date.now() % 1000);

    setTimeout(function sinkron() {

        updateJam();

        setInterval(updateJam, 1000);

    }, delay);

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


// ======================================
// UPDATE STATUS SETIAP MENIT
// ======================================

function updateStatus() {

    semuaData.forEach(item => {

        const sekarang = new Date();

        const menitSekarang =
            sekarang.getHours() * 60 +
            sekarang.getMinutes();

        const waktu = item.jam.split("-");

        const mulai = waktu[0].trim().split(":");

        const selesai = waktu[1].trim().split(":");

        const menitMulai =
            Number(mulai[0]) * 60 +
            Number(mulai[1]);

        const menitSelesai =
            Number(selesai[0]) * 60 +
            Number(selesai[1]);

        if (menitSekarang < menitMulai) {

            item.status = "Belum Mulai";

        }

        else if (

            menitSekarang >= menitMulai &&
            menitSekarang < menitSelesai

        ) {

            item.status = "Berlangsung";

        }

        else {

            item.status = "Selesai";

        }

    });

    tampilkanRuangan();

}


// ======================================
// START
// ======================================

window.addEventListener("load", () => {

    loadData();

});


// Update jam
setInterval(updateJam, 1000);

// Update status
setInterval(updateStatus, 1000);

// Ambil data terbaru dari admin
setInterval(refreshData, 1000);

// Ganti ruangan
setInterval(nextRoom, 10000);