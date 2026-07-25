// ======================================
// DIGITAL SIGNAGE TV - POLIDEWA
// ======================================

// ======================================
// JAM & TANGGAL
// ======================================

// ======================================
// JAM & TANGGAL (NTP + WITA, dari server)
// ======================================

let waktuServerMs = null;
let waktuLokalSaatSync = null;

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

    setInterval(renderJamTanggal, 1000);

    setInterval(syncWaktuServer, 30000);

}

mulaiJam();

// ======================================
// 🔥 FUNGSI CUACA (OpenWeatherMap)
// ======================================

// Konfigurasi API Key
const WEATHER_CONFIG = {
    apiKey: '0c9f105e364361f2f5d79337ae1fbae3', // API Key dari OpenWeatherMap
    city: 'Palopo',
    country: 'ID',
    units: 'metric',
    lang: 'id'
};

async function getWeatherData() {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CONFIG.city},${WEATHER_CONFIG.country}&units=${WEATHER_CONFIG.units}&lang=${WEATHER_CONFIG.lang}&appid=${WEATHER_CONFIG.apiKey}`;
        
        const response = await fetch(url, {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.main && data.weather) {
            return {
                temp: Math.round(data.main.temp),
                icon: getWeatherIcon(data.weather[0].icon),
                condition: data.weather[0].description,
                city: data.name,
                country: data.sys.country
            };
        }
        
        throw new Error('Invalid weather data format');
        
    } catch (err) {
        console.warn('⚠️ Gagal mengambil data cuaca:', err);
        return null;
    }
}

function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fa-sun',
        '01n': 'fa-moon',
        '02d': 'fa-cloud-sun',
        '02n': 'fa-cloud-moon',
        '03d': 'fa-cloud',
        '03n': 'fa-cloud',
        '04d': 'fa-cloud',
        '04n': 'fa-cloud',
        '09d': 'fa-cloud-rain',
        '09n': 'fa-cloud-rain',
        '10d': 'fa-cloud-sun-rain',
        '10n': 'fa-cloud-moon-rain',
        '11d': 'fa-cloud-bolt',
        '11n': 'fa-cloud-bolt',
        '13d': 'fa-snowflake',
        '13n': 'fa-snowflake',
        '50d': 'fa-smog',
        '50n': 'fa-smog'
    };
    return iconMap[iconCode] || 'fa-cloud';
}

async function updateCuaca() {
    const weatherData = await getWeatherData();
    
    const weatherIcon = document.getElementById('weatherIcon');
    const suhuElement = document.getElementById('suhu');
    const namaLokasi = document.getElementById('namaLokasi');
    
    if (weatherData) {
        if (weatherIcon) {
            weatherIcon.className = `fa-solid ${weatherData.icon}`;
        }
        if (suhuElement) {
            suhuElement.textContent = `${weatherData.temp}°C`;
        }
        if (namaLokasi) {
            namaLokasi.textContent = `${weatherData.city}`;
        }
        console.log(`🌤️ Cuaca: ${weatherData.temp}°C - ${weatherData.condition} - ${weatherData.city}`);
    } else {
        if (weatherIcon) {
            weatherIcon.className = 'fa-solid fa-cloud-sun';
        }
        if (suhuElement) {
            suhuElement.textContent = '--°C';
        }
        if (namaLokasi) {
            namaLokasi.textContent = 'Palopo';
        }
        console.log('⚠️ Menggunakan data cuaca default');
    }
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


// ======================================
// START
// ======================================

window.addEventListener("load", () => {

    loadData();
    
    // 🔥 Update cuaca saat load
    updateCuaca();

});


// Ambil data terbaru dari server
setInterval(refreshData, 15000);

// Ganti ruangan
setInterval(nextRoom, 10000);

// 🔥 Update cuaca
setInterval(updateCuaca, 10000);