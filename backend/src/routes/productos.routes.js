const express = require("express");

const {
  obtenerProductos,
  obtenerProductosAdmin,
  crearProducto,
  actualizarProducto,
} = require("../controllers/productos.controller");

const { verificarToken } = require("../auth/auth.middleware");

const upload = require("../config/upload");

const router = express.Router();

router.get("/", obtenerProductos);

router.get("/admin", verificarToken, obtenerProductosAdmin);

router.post("/", verificarToken, upload.single("imagen"), crearProducto);

router.patch(
  "/:id",
  verificarToken,
  upload.single("imagen"),
  actualizarProducto,
);

module.exports = router;
