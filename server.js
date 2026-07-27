const express = require("express");
const path = require("path");

const { mulaiAutoSync } = require("./utils/ntpTime");

const app = express();

// ======================================
// Sinkronisasi Jam NTP (WITA)
// ======================================

mulaiAutoSync();

// ======================================
// View Engine
// ======================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======================================
// Middleware
// ======================================

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({extended: true}));

app.use(express.json());

// ======================================
// Routes
// ======================================

app.use("/admin", require("./routes/admin"));

app.use("/api", require("./routes/api"));

app.use("/", require("./routes/tv"));

// ======================================
// 404
// ======================================

app.use((req, res) => {

    res.status(404).send("<h2>404 | Halaman tidak ditemukan</h2>");

});

// ======================================
// Error Handler
// ======================================

app.use(function(err, req, res, next) {
    console.error("Error:", err);
    res.status(500).send("<h2>Error: " + err.message + "</h2>");
});

// ======================================
// Start Server
// ======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server berjalan di http://localhost:${PORT}`);

});