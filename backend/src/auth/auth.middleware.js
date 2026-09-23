const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const autorizacion = req.headers.authorization;

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "No autorizado.",
    });
  }

  const token = autorizacion.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      mensaje: "No autorizado.",
    });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);

    if (!usuario || typeof usuario !== "object" || usuario.rol !== "admin") {
      return res.status(403).json({
        mensaje: "No tenés permisos para realizar esta acción.",
      });
    }

    req.usuario = usuario;

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: "Sesión inválida o expirada.",
    });
  }
};

module.exports = {
  verificarToken,
};
