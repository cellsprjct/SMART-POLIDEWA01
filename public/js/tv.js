// ======================================
// DIGITAL SIGNAGE TV - POLIDEWA
// ======================================

// ======================================
// JAM & TANGGAL
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

    const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    document.getElementById("jam").textContent = `${jam}:${menit}:${detik}`;
    document.getElementById("tanggal").textContent =
        `${namaHari[sekarang.getUTCDay()]}, ${sekarang.getUTCDate()} ${namaBulan[sekarang.getUTCMonth()]} ${sekarang.getUTCFullYear()}`;
}

function mulaiJam() {
    syncWaktuServer().then(renderJamTanggal);
    setInterval(renderJamTanggal, 1000);
    setInterval(syncWaktuServer, 30000);
}
mulaiJam();

// ======================================
// FUNGSI CUACA (OpenWeatherMap)
// ======================================

const WEATHER_CONFIG = {
    apiKey: '0c9f105e364361f2f5d79337ae1fbae3',
    city: 'Palopo',
    country: 'ID',
    units: 'metric',
    lang: 'id'
};

async function getWeatherData() {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CONFIG.city},${WEATHER_CONFIG.country}&units=${WEATHER_CONFIG.units}&lang=${WEATHER_CONFIG.lang}&appid=${WEATHER_CONFIG.apiKey}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        '01d': 'fa-sun', '01n': 'fa-moon',
        '02d': 'fa-cloud-sun', '02n': 'fa-cloud-moon',
        '03d': 'fa-cloud', '03n': 'fa-cloud',
        '04d': 'fa-cloud', '04n': 'fa-cloud',
        '09d': 'fa-cloud-rain', '09n': 'fa-cloud-rain',
        '10d': 'fa-cloud-sun-rain', '10n': 'fa-cloud-moon-rain',
        '11d': 'fa-cloud-bolt', '11n': 'fa-cloud-bolt',
        '13d': 'fa-snowflake', '13n': 'fa-snowflake',
        '50d': 'fa-smog', '50n': 'fa-smog'
    };
    return iconMap[iconCode] || 'fa-cloud';
}

async function updateCuaca() {
    const weatherData = await getWeatherData();
    const weatherIcon = document.getElementById('weatherIcon');
    const suhuElement = document.getElementById('suhu');
    const namaLokasi = document.getElementById('namaLokasi');
    
    if (weatherData) {
        if (weatherIcon) weatherIcon.className = `fa-solid ${weatherData.icon}`;
        if (suhuElement) suhuElement.textContent = `${weatherData.temp}°C`;
        if (namaLokasi) namaLokasi.textContent = `${weatherData.city}`;
    } else {
        if (weatherIcon) weatherIcon.className = 'fa-solid fa-cloud-sun';
        if (suhuElement) suhuElement.textContent = '--°C';
        if (namaLokasi) namaLokasi.textContent = 'Palopo';
    }
}

// ======================================
// VARIABEL GLOBAL
// ======================================

let semuaData = [];
let daftarRuangan = [];
let indexRuangan = 0;
let slideshowData = [];
let slideIndex = 0;
let slideTimer = null;
let isSlideshowMode = false;
let currentVideoElement = null;

// ======================================
// SLIDESHOW FUNCTIONS
// ======================================

async function loadSlideshow() {
    try {
        const response = await fetch("/admin/api/slideshow", { cache: "no-store" });
        const data = await response.json();
        slideshowData = data.slideshow || [];
        console.log("📽️ Slideshow loaded:", slideshowData.length, "items");
        return slideshowData;
    } catch (err) {
        console.error("Gagal load slideshow:", err);
        slideshowData = [];
        return [];
    }
}

// 🔥 SHOW SLIDE - VIDEO DENGAN SUARA
function showSlide(index) {
    const slideContainer = document.getElementById("slideshowContainer");
    if (!slideContainer) {
        console.error("❌ slideshowContainer tidak ditemukan!");
        return;
    }

    if (slideshowData.length === 0 || index >= slideshowData.length) {
        slideContainer.style.display = "none";
        document.body.classList.remove("slideshow-active");
        isSlideshowMode = false;
        return;
    }

    const slide = slideshowData[index];
    const isVideo = slide.type === 'video';
    const url = slide.url;

    console.log(`📽️ Menampilkan slide ${index + 1}/${slideshowData.length}: ${slide.title} (${slide.type})`);

    // Sembunyikan semua konten kecuali header dan running text
    document.body.classList.add("slideshow-active");

    let html = '';
    if (isVideo) {
        // 🔥 VIDEO DENGAN SUARA - HAPUS 'muted'
        html = `
            <video id="slideVideo" autoplay playsinline style="width:100%; height:100%; object-fit:contain; background:#000;">
                <source src="${url}" type="${slide.mimetype}">
                Browser tidak mendukung video.
            </video>
        `;
    } else {
        html = `
            <img src="${url}" alt="${slide.title}" style="width:100%; height:100%; object-fit:contain; background:#000;">
        `;
    }

    slideContainer.innerHTML = html;
    slideContainer.style.display = "flex";
    isSlideshowMode = true;

    if (isVideo) {
        const video = document.getElementById("slideVideo");
        if (video) {
            currentVideoElement = video;
            
            // 🔥 VIDEO DIPUTAR SAMPAI SELESAI DENGAN SUARA
            video.onended = function() {
                console.log("📽️ Video selesai diputar, lanjut ke slide berikutnya");
                nextSlide();
            };
            
            // 🔥 MULAI PLAY VIDEO DENGAN SUARA
            video.play().catch(function(err) {
                console.warn("⚠️ Video play error:", err);
                // Jika gagal, lanjutkan setelah 2 detik
                setTimeout(function() {
                    nextSlide();
                }, 2000);
            });
        }
    } else {
        // Gambar tampil 5 detik
        if (slideTimer) {
            clearTimeout(slideTimer);
            slideTimer = null;
        }
        slideTimer = setTimeout(function() {
            nextSlide();
        }, 5000);
    }
}

function nextSlide() {
    slideIndex++;
    if (slideIndex >= slideshowData.length) {
        console.log("📽️ Semua slide selesai, kembali ke mode normal");
        stopSlideshow();
        const slideContainer = document.getElementById("slideshowContainer");
        if (slideContainer) {
            slideContainer.style.display = "none";
        }
        document.body.classList.remove("slideshow-active");
        isSlideshowMode = false;
        tampilkanRuangan();
        return;
    }
    showSlide(slideIndex);
}

function startSlideshow() {
    if (slideshowData.length === 0) {
        console.log("📽️ Tidak ada slide untuk ditampilkan");
        const slideContainer = document.getElementById("slideshowContainer");
        if (slideContainer) {
            slideContainer.style.display = "none";
        }
        document.body.classList.remove("slideshow-active");
        isSlideshowMode = false;
        return;
    }

    console.log("📽️ Memulai slideshow dengan", slideshowData.length, "slide");

    // Sembunyikan semua konten
    document.body.classList.add("slideshow-active");

    if (slideTimer) {
        clearTimeout(slideTimer);
        slideTimer = null;
    }

    slideIndex = 0;
    showSlide(slideIndex);
}

function stopSlideshow() {
    if (slideTimer) {
        clearTimeout(slideTimer);
        slideTimer = null;
    }
    if (currentVideoElement) {
        currentVideoElement.pause();
        currentVideoElement = null;
    }
    const slideContainer = document.getElementById("slideshowContainer");
    if (slideContainer) {
        slideContainer.style.display = "none";
    }
    document.body.classList.remove("slideshow-active");
    isSlideshowMode = false;
}

// ======================================
// LOAD DATA DARI API
// ======================================

async function loadData() {
    try {
        const response = await fetch("/api/jadwal", { cache: "no-store" });
        semuaData = await response.json();
        daftarRuangan = [...new Set(semuaData.map(function(item) { return item.ruangan; }))];
        if (indexRuangan >= daftarRuangan.length) {
            indexRuangan = 0;
        }
        await loadSlideshow();
        tampilkanRuangan();
    } catch (err) {
        console.error("Gagal mengambil data :", err);
    }
}

// ======================================
// TAMPILKAN RUANGAN AKTIF
// ======================================

function tampilkanRuangan() {
    stopSlideshow();

    var roomTitle = document.getElementById("ruanganAktif");
    var tbody = document.getElementById("tbodyJadwal");
    var panel = document.getElementById("kelasSaatIni");

    if (daftarRuangan.length === 0) {
        roomTitle.textContent = "-";
        tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center; padding:40px 0; font-size:28px; color:#999;">
                <i class="fa-solid fa-calendar-xmark" style="font-size:48px; display:block; margin-bottom:15px; color:#ccc;"></i>
                Tidak ada jadwal hari ini
            </td>
        </tr>
        `;
        panel.innerHTML = `
        <div class="panel-box">
            <i class="fa-solid fa-book-open"></i>
            <div class="panel-text no-class-text">
                <div class="no-class-title">Belum ada kelas berlangsung</div>
                <div class="no-class-subtitle">Silakan menunggu jadwal berikutnya</div>
            </div>
        </div>
        <div class="panel-box">
            <i class="fa-regular fa-clock"></i>
            <div><h3>WAKTU</h3><p>-</p></div>
        </div>
        <div class="panel-box">
            <i class="fa-solid fa-user"></i>
            <div><h3>DOSEN</h3><p>-</p></div>
        </div>
        <div class="panel-box">
            <i class="fa-solid fa-building"></i>
            <div><h3>RUANGAN</h3><p>-</p></div>
        </div>
        `;
        return;
    }

    var ruangan = daftarRuangan[indexRuangan];
    roomTitle.textContent = ruangan;
    var dataRuangan = semuaData.filter(function(item) { return item.ruangan === ruangan; });
    tampilkanTabel(dataRuangan);
    tampilkanKelasSaatIni(dataRuangan);
}

// ======================================
// TAMPILKAN TABEL JADWAL
// ======================================

function tampilkanTabel(data) {
    var tbody = document.getElementById("tbodyJadwal");
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; padding:40px 0; font-size:28px; color:#999;">
                <i class="fa-solid fa-calendar-xmark" style="font-size:48px; display:block; margin-bottom:15px; color:#ccc;"></i>
                Tidak ada jadwal pada ruangan ini
            </td>
        </tr>
        `;
        return;
    }

    data.sort(function(a, b) {
        return a.jam.split("-")[0].trim().localeCompare(b.jam.split("-")[0].trim());
    });

    data.slice(0, 10).forEach(function(item) {
        var badge = "";
        var rowClass = "";

        switch (item.status) {
            case "Berlangsung":
                badge = '<span class="badge badge-green">BERLANGSUNG</span>';
                rowClass = "row-active";
                break;
            case "Belum Mulai":
                badge = '<span class="badge badge-orange">BELUM MULAI</span>';
                break;
            default:
                badge = '<span class="badge badge-gray">SELESAI</span>';
        }

        tbody.innerHTML += `
        <tr class="${rowClass}">
            <td><strong>${item.jamDisplay || item.jam}</strong></td>
            <td><strong>${item.matkul}</strong></td>
            <td><strong>${item.prodi || "-"}</strong></td>
            <td><strong>${item.dosen}</strong></td>
            <td>${badge}</td>
        </tr>
        `;
    });
}

// ======================================
// PANEL KELAS SAAT INI
// ======================================

function tampilkanKelasSaatIni(data) {
    var panel = document.getElementById("kelasSaatIni");
    var sekarang = data.find(function(x) { return x.status === "Berlangsung"; });

    if (!sekarang) {
        panel.innerHTML = `
        <div class="panel-box">
            <i class="fa-solid fa-book-open"></i>
            <div class="panel-text no-class-text">
                <div class="no-class-title">Belum ada kelas berlangsung</div>
                <div class="no-class-subtitle">Silakan menunggu jadwal berikutnya</div>
            </div>
        </div>
        <div class="panel-box">
            <i class="fa-regular fa-clock"></i>
            <div><h3>WAKTU</h3><p>-</p></div>
        </div>
        <div class="panel-box">
            <i class="fa-solid fa-user"></i>
            <div><h3>DOSEN</h3><p>-</p></div>
        </div>
        <div class="panel-box">
            <i class="fa-solid fa-building"></i>
            <div><h3>RUANGAN</h3><p>-</p></div>
        </div>
        `;
        return;
    }

    panel.innerHTML = `
    <div class="panel-box">
        <i class="fa-solid fa-book-open"></i>
        <div class="panel-text">
            <div class="panel-value">${sekarang.matkul}</div>
            <div class="panel-label">${sekarang.prodi}</div>
        </div>
    </div>
    <div class="panel-box">
        <i class="fa-regular fa-clock"></i>
        <div class="panel-text">
            <div class="panel-label">WAKTU</div>
            <div class="panel-value">${sekarang.jamDisplay || sekarang.jam}</div>
        </div>
    </div>
    <div class="panel-box">
        <i class="fa-solid fa-user"></i>
        <div class="panel-text">
            <div class="panel-label">DOSEN</div>
            <div class="panel-value">${sekarang.dosen}</div>
        </div>
    </div>
    <div class="panel-box">
        <i class="fa-solid fa-building"></i>
        <div class="panel-text">
            <div class="panel-label">RUANGAN</div>
            <div class="panel-value">${sekarang.ruangan}</div>
        </div>
    </div>
    `;
}

// ======================================
// GANTI RUANGAN OTOMATIS
// ======================================

function nextRoom() {
    if (isSlideshowMode) return;
    if (daftarRuangan.length <= 1) return;
    indexRuangan++;
    if (indexRuangan >= daftarRuangan.length) {
        indexRuangan = 0;
        if (slideshowData.length > 0) {
            console.log("📽️ Memulai slideshow setelah semua ruangan");
            startSlideshow();
            return;
        }
    }
    tampilkanRuangan();
}

// ======================================
// REFRESH DATA DARI SERVER
// ======================================

async function refreshData() {
    try {
        const response = await fetch("/api/jadwal?t=" + Date.now(), { cache: "no-store" });
        semuaData = await response.json();
        daftarRuangan = [...new Set(semuaData.map(function(item) { return item.ruangan; }))];
        if (indexRuangan >= daftarRuangan.length) {
            indexRuangan = 0;
        }
        if (!isSlideshowMode) {
            tampilkanRuangan();
        }
    } catch (err) {
        console.error(err);
    }
}

// ======================================
// LOAD RUNNING TEXT
// ======================================

async function loadRunningText() {
    try {
        const response = await fetch("/api/running-text", { cache: "no-store" });
        const data = await response.json();
        if (data.text) {
            var marquee = document.getElementById("runningText");
            if (marquee) marquee.textContent = data.text;
        }
    } catch (err) {
        console.error("Gagal load running text:", err);
    }
}

// ======================================
// START
// ======================================

window.addEventListener("load", function() {
    console.log("🚀 SMART POLIDEWA Starting...");
    loadData();
    updateCuaca();
    loadRunningText();
    console.log("✅ SMART POLIDEWA siap!");
});

setInterval(refreshData, 15000);
setInterval(nextRoom, 10000);
setInterval(updateCuaca, 600000);
setInterval(loadRunningText, 30000);