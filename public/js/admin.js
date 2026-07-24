// ======================================
// FILTER DASHBOARD ADMIN
// ======================================

const filterHari = document.getElementById("filterHari");
const filterRuangan = document.getElementById("filterRuangan");
const filterProdi = document.getElementById("filterProdi");
const searchMatkul = document.getElementById("searchMatkul");

function filterTabel() {

    const hari = filterHari.value.trim().toLowerCase();
    const ruangan = filterRuangan.value.trim().toLowerCase();
    const prodi = filterProdi.value.trim().toLowerCase();
    const keyword = searchMatkul.value.trim().toLowerCase();

    const rows = document.querySelectorAll(".jadwal-row");

    let nomor = 1;

    rows.forEach(row => {

        const dataHari =
            row.querySelector(".hari")
            .textContent
            .trim()
            .toLowerCase();

        const dataRuangan =
            row.querySelector(".ruangan")
            .textContent
            .trim()
            .toLowerCase();

        const dataProdi =
            row.querySelector(".prodi")
            .textContent
            .trim()
            .toLowerCase();

        const dataMatkul =
            row.querySelector(".matkul")
            .textContent
            .trim()
            .toLowerCase();

        const cocokHari =
            hari === "" ||
            dataHari === hari;

        const cocokRuangan =
            ruangan === "" ||
            dataRuangan === ruangan;

        const cocokProdi =
            prodi === "" ||
            dataProdi === prodi;

        const cocokMatkul =
            keyword === "" ||
            dataMatkul.includes(keyword);

        if (
            cocokHari &&
            cocokRuangan &&
            cocokProdi &&
            cocokMatkul
        ) {

            row.style.display = "";

            row.cells[0].textContent = nomor++;

        } else {

            row.style.display = "none";

        }

    });

}

filterHari.addEventListener("change", filterTabel);
filterRuangan.addEventListener("change", filterTabel);
filterProdi.addEventListener("change", filterTabel);
searchMatkul.addEventListener("keyup", filterTabel);

window.addEventListener("load", filterTabel);