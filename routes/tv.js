const express = require("express");

const router = express.Router();

/* ==========================================
   HALAMAN TV
========================================== */

router.get("/", (req, res) => {

    res.render("tv", {

        title: "SMART POLIDEWA"

    });

});

module.exports = router;