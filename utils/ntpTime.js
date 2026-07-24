// ======================================
// NTP TIME (WITA / Asia-Makassar)
// ======================================
// Modul ini mengambil waktu asli dari server NTP publik
// (bukan sekadar jam OS server/browser), lalu dikonversi
// ke WITA (UTC+8, tidak ada DST) agar penentuan status
// jadwal selalu akurat walau jam sistem server salah/drift
// atau server di-hosting di timezone lain (mis. UTC).

const dgram = require("dgram");

const NTP_SERVERS = [

    "id.pool.ntp.org",

    "0.id.pool.ntp.org",

    "1.asia.pool.ntp.org",

    "time.google.com"

];

const NTP_PORT = 123;

const TIMEOUT_MS = 3000;

// Sinkron ulang tiap 10 menit (tidak perlu tiap detik/menit)
const SYNC_INTERVAL_MS = 10 * 60 * 1000;

// Selisih (waktu NTP - waktu sistem lokal) dalam milidetik
let offsetMs = 0;

let sinkronTerakhirBerhasil = false;


// ======================================
// AMBIL WAKTU DARI 1 SERVER NTP
// ======================================

function ambilWaktuNtp(host) {

    return new Promise((resolve, reject) => {

        const socket = dgram.createSocket("udp4");

        const packet = Buffer.alloc(48);

        // LI=0, VN=3, Mode=3 (client request)
        packet[0] = 0x1B;

        const timer = setTimeout(() => {

            socket.close();

            reject(new Error("Timeout menghubungi " + host));

        }, TIMEOUT_MS);

        socket.once("error", (err) => {

            clearTimeout(timer);

            socket.close();

            reject(err);

        });

        socket.once("message", (msg) => {

            clearTimeout(timer);

            const seconds = msg.readUInt32BE(40);

            const fraction = msg.readUInt32BE(44);

            // Selisih epoch NTP (1900) ke epoch Unix (1970)
            const NTP_UNIX_DIFF = 2208988800;

            const ms =
                (seconds - NTP_UNIX_DIFF) * 1000 +
                Math.round((fraction / 4294967296) * 1000);

            socket.close();

            resolve(ms);

        });

        socket.send(packet, 0, packet.length, NTP_PORT, host, (err) => {

            if (err) {

                clearTimeout(timer);

                socket.close();

                reject(err);

            }

        });

    });

}


// ======================================
// SINKRONISASI (coba tiap server berurutan)
// ======================================

async function sinkronNtp() {

    for (const host of NTP_SERVERS) {

        try {

            const waktuNtpMs = await ambilWaktuNtp(host);

            const waktuLokalMs = Date.now();

            offsetMs = waktuNtpMs - waktuLokalMs;

            sinkronTerakhirBerhasil = true;

            console.log(`[NTP] Sinkron berhasil dari ${host} (offset ${offsetMs} ms)`);

            return true;

        } catch (err) {

            console.warn(`[NTP] Gagal ke ${host}: ${err.message}`);

        }

    }

    sinkronTerakhirBerhasil = false;

    console.warn("[NTP] Semua server NTP gagal dihubungi, pakai jam sistem sebagai fallback");

    return false;

}


// ======================================
// MULAI AUTO-SYNC (dipanggil sekali dari server.js)
// ======================================

function mulaiAutoSync() {

    sinkronNtp();

    setInterval(sinkronNtp, SYNC_INTERVAL_MS);

}


// ======================================
// WAKTU SEKARANG (sudah dikoreksi offset NTP)
// ======================================

function getNow() {

    return new Date(Date.now() + offsetMs);

}


// ======================================
// WAKTU SEKARANG DI WITA (Asia/Makassar, UTC+8 tetap)
// Catatan: hasil Date ini "digeser" sehingga method
// getUTCHours()/getUTCMinutes()/getUTCDay() langsung
// merepresentasikan jam & hari versi WITA, terlepas
// dari timezone OS server.
// ======================================

function getNowMakassar() {

    const utcMs = getNow().getTime();

    return new Date(utcMs + 8 * 60 * 60 * 1000);

}


function statusSinkron() {

    return {

        tersinkron: sinkronTerakhirBerhasil,

        offsetMs

    };

}


module.exports = {

    mulaiAutoSync,

    sinkronNtp,

    getNow,

    getNowMakassar,

    statusSinkron

};
