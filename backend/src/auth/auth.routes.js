const express = require("express");
const rateLimit = require("express-rate-limit");

const { login } = require("./auth.controller");

const router = express.Router();

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    mensaje:
      "Demasiados intentos de inicio de sesión. Intentá nuevamente más tarde.",
  },
});

router.post("/login", limiteLogin, login);

module.exports = router;
