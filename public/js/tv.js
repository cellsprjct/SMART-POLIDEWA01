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
// FUNGSI CUACA (OpenWeatherMap)
// ======================================

// 🔥 MENGGUNAKAN API KEY YANG SUDAH DIBUAT
const WEATHER_CONFIG = {
    apiKey: '0c9f105e364361f2f5d79337ae1fbae3', // API Key dari OpenWeatherMap
    city: 'Palopo',
    country: 'ID',
    units: 'metric',
    lang: 'id'
};

async function getWeatherData() {
    try {
        // Gunakan endpoint yang benar
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CONFIG.city},${WEATHER_CONFIG.country}&units=${WEATHER_CONFIG.units}&lang=${WEATHER_CONFIG.lang}&appid=${WEATHER_CONFIG.apiKey}`;
        
        console.log(`🌤️ Mengambil data cuaca untuk ${WEATHER_CONFIG.city}...`);
        
        const response = await fetch(url, {
            cache: 'no-store'
        });
        
        console.log(`📡 Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error dari OpenWeatherMap:', errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        console.log('✅ Data cuaca berhasil diambil:', data);
        
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
        console.warn('⚠️ Gagal mengambil data cuaca:', err.message);
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
        // Update icon cuaca
        if (weatherIcon) {
            weatherIcon.className = `fa-solid ${weatherData.icon}`;
        }
        
        // Update suhu
        if (suhuElement) {
            suhuElement.textContent = `${weatherData.temp}°C`;
        }
        
        // Update lokasi
        if (namaLokasi) {
            namaLokasi.textContent = `${weatherData.city}`;
        }
        
        console.log(`🌤️ Cuaca: ${weatherData.temp}°C - ${weatherData.condition} - ${weatherData.city}`);
    } else {
        // Jika gagal ambil data, tampilkan default
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
                WAKTU
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
    const waktuWita = new Date(sekarang.toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
    }));
    
    const menitSekarang = waktuWita.getHours() * 60 + waktuWita.getMinutes();

    semuaData.forEach(item => {
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
    // Sinkronisasi waktu dengan server
    await syncTimeWithServer();
    
    // Mulai jam
    mulaiJam();
    
    // Load data jadwal
    await loadData();
    
    // Update status
    updateStatus();
    
    // Update cuaca
    await updateCuaca();
    
    // Update last update
    updateLastUpdate();
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

// Update cuaca setiap 10 menit
setInterval(updateCuaca, 600000);

// ======================================
// UPDATE LAST UPDATE
// ======================================

function updateLastUpdate() {
    const sekarang = getServerTime();
    const waktuWita = new Date(sekarang.toLocaleString("en-US", {
        timeZone: "Asia/Makassar"
    }));
    
    const jam = String(waktuWita.getHours()).padStart(2, "0");
    const menit = String(waktuWita.getMinutes()).padStart(2, "0");
    const detik = String(waktuWita.getSeconds()).padStart(2, "0");
    
    const lastUpdate = document.getElementById("lastUpdate");
    if (lastUpdate) {
        lastUpdate.textContent = `Terakhir diperbarui: ${jam}:${menit}:${detik} WITA`;
    }
}