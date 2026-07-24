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

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

// ======================================
// Routes
// ======================================

app.use("/admin", require("./routes/admin"));

app.use("/api", require("./routes/api"));

app.use("/", require("./routes/tv"));

// ======================================
// API CUACA (Proxy untuk menghindari CORS)
// ======================================

app.get("/api/weather", async (req, res) => {
    try {
        const city = req.query.city || 'Makassar';
        const apiKey = process.env.WEATHER_API_KEY || 'YOUR_API_KEY';
        
        // Gunakan OpenWeatherMap
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},ID&units=metric&lang=id&appid=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === 200) {
            res.json({
                success: true,
                data: {
                    temp: Math.round(data.main.temp),
                    icon: data.weather[0].icon,
                    condition: data.weather[0].description,
                    city: data.name,
                    country: data.sys.country
                }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'City not found'
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// ======================================
// 404
// ======================================

app.use((req, res) => {

    res.status(404).send("<h2>404 | Halaman tidak ditemukan</h2>");

});

// ======================================
// Start Server
// ======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server berjalan di http://localhost:${PORT}`);

});