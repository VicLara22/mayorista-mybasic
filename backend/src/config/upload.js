const multer = require("multer");
const path = require("path");
const fs = require("fs");

const carpetaImagenes = path.join(__dirname, "../../../frontend/imagenes");

const crearNombreSeguro = (texto) => {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const nombreProducto = crearNombreSeguro(req.body.nombre);

    if (!nombreProducto) {
      return cb(new Error("El nombre del producto es obligatorio."));
    }

    const carpetaProducto = path.join(carpetaImagenes, nombreProducto);

    fs.mkdirSync(carpetaProducto, { recursive: true });

    cb(null, carpetaProducto);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const nombre = path.basename(file.originalname, extension);

    const nombreSeguro = crearNombreSeguro(nombre);

    const nombreFinal = `${nombreSeguro}-${Date.now()}${extension}`;

    cb(null, nombreFinal);
  },
});

const fileFilter = (req, file, cb) => {
  const extensionesPermitidas = [".jpg", ".jpeg", ".png", ".webp"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (!extensionesPermitidas.includes(extension)) {
    return cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
