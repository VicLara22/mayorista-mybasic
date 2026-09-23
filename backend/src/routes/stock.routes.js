const express = require("express");

const {
  obtenerStock,
  obtenerStockPublico,
  actualizarStock,
} = require("../controllers/stock.controller");

const { verificarToken } = require("../auth/auth.middleware");

const router = express.Router();

router.get("/publico", obtenerStockPublico);

router.get("/", verificarToken, obtenerStock);

router.patch("/:id", verificarToken, actualizarStock);

module.exports = router;
