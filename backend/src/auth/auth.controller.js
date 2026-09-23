const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({
      mensaje: "Ingresá usuario y contraseña.",
    });
  }

  if (usuario !== process.env.ADMIN_USER) {
    return res.status(401).json({
      mensaje: "Usuario o contraseña incorrectos.",
    });
  }

  const contraseñaValida = await bcrypt.compare(
    contraseña,
    process.env.ADMIN_PASSWORD_HASH,
  );

  if (!contraseñaValida) {
    return res.status(401).json({
      mensaje: "Usuario o contraseña incorrectos.",
    });
  }

  const token = jwt.sign(
    {
      usuario,
      rol: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    },
  );

  return res.json({
    mensaje: "Inicio de sesión correcto.",
    token,
  });
};

module.exports = {
  login,
};