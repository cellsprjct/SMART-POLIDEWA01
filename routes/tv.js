const express = require("express");
const router = express.Router();

router.get("/", function(req, res) {
    try {
        res.render("tv", {
            title: "SMART POLIDEWA"
        });
    } catch (err) {
        console.error("Error TV:", err);
        res.send("<h2>Error: " + err.message + "</h2>");
    }
});

module.exports = router;