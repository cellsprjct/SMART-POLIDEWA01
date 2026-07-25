// ======================================
// FILTER DASHBOARD ADMIN
// ======================================

document.addEventListener("DOMContentLoaded", function() {

    const filterHari = document.getElementById("filterHari");
    const filterRuangan = document.getElementById("filterRuangan");
    const filterProdi = document.getElementById("filterProdi");
    const searchMatkul = document.getElementById("searchMatkul");

    function filterTabel() {

        const hari = filterHari ? filterHari.value.trim().toLowerCase() : "";
        const ruangan = filterRuangan ? filterRuangan.value.trim().toLowerCase() : "";
        const prodi = filterProdi ? filterProdi.value.trim().toLowerCase() : "";
        const keyword = searchMatkul ? searchMatkul.value.trim().toLowerCase() : "";

        const rows = document.querySelectorAll(".jadwal-row");

        let nomor = 1;

        rows.forEach(row => {

            // Ambil data dari atribut data-*
            const dataHari = (row.getAttribute("data-hari") || "").toLowerCase();
            const dataRuangan = (row.getAttribute("data-ruangan") || "").toLowerCase();
            const dataProdi = (row.getAttribute("data-prodi") || "").toLowerCase();
            const dataMatkul = (row.getAttribute("data-matkul") || "").toLowerCase();

            let cocokHari = true;
            let cocokRuangan = true;
            let cocokProdi = true;
            let cocokMatkul = true;

            if (hari) cocokHari = dataHari === hari;
            if (ruangan) cocokRuangan = dataRuangan === ruangan;
            if (prodi) cocokProdi = dataProdi === prodi;
            if (keyword) cocokMatkul = dataMatkul.includes(keyword);

            if (cocokHari && cocokRuangan && cocokProdi && cocokMatkul) {
                row.style.display = "";
                const tdNo = row.querySelector("td:first-child");
                if (tdNo) tdNo.textContent = nomor++;
            } else {
                row.style.display = "none";
            }

        });

    }

    if (filterHari) filterHari.addEventListener("change", filterTabel);
    if (filterRuangan) filterRuangan.addEventListener("change", filterTabel);
    if (filterProdi) filterProdi.addEventListener("change", filterTabel);
    if (searchMatkul) searchMatkul.addEventListener("keyup", filterTabel);

    // Jalankan pertama kali
    setTimeout(filterTabel, 100);

    console.log("✅ Filter siap digunakan");

});