const express = require("express");

const {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
} = require("../controllers/pedidos.controller");

const { verificarToken } = require("../auth/auth.middleware");

const router = express.Router();

router.post("/", crearPedido);

router.get("/", verificarToken, obtenerPedidos);

router.get("/:id", verificarToken, obtenerPedidoPorId);

router.patch(
  "/:id/estado",
  verificarToken,
  actualizarEstadoPedido,
);

module.exports = router;