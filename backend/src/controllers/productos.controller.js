const pool = require("../config/database");

const crearNombreSeguro = (texto) => {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const obtenerProductos = async (req, res) => {
  try {
    const resultado = await pool.query(`
  SELECT
    id,
    nombre,
    categoria,
    colores,
    talles,
    precio,
    descripcion,
    lavado,
    uso,
    img
  FROM productos
  WHERE activo = TRUE
  ORDER BY id
`);

    return res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los productos",
    });
  }
};

const obtenerProductosAdmin = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id,
        nombre,
        categoria,
        colores,
        talles,
        precio,
        descripcion,
        lavado,
        uso,
        img,
        activo,
        created_at
      FROM productos
      ORDER BY id
    `);

    return res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener productos para administración:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los productos",
    });
  }
};

const crearProducto = async (req, res) => {
  let coloresParseados;
  let tallesParseados;

  try {
    coloresParseados =
      typeof req.body.colores === "string"
        ? JSON.parse(req.body.colores)
        : req.body.colores;

    tallesParseados =
      typeof req.body.talles === "string"
        ? JSON.parse(req.body.talles)
        : req.body.talles;
  } catch (error) {
    return res.status(400).json({
      mensaje: "Los colores o talles no tienen un formato válido.",
    });
  }

  const { nombre, categoria, precio, descripcion, lavado, uso } = req.body;

  const activo =
    typeof req.body.activo === "string"
      ? req.body.activo === "true"
      : req.body.activo;

  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    typeof categoria !== "string" ||
    !categoria.trim()
  ) {
    return res.status(400).json({
      mensaje: "El nombre y la categoría son obligatorios.",
    });
  }

  if (
    !Array.isArray(coloresParseados) ||
    coloresParseados.length === 0 ||
    !Array.isArray(tallesParseados) ||
    tallesParseados.length === 0
  ) {
    return res.status(400).json({
      mensaje: "El producto debe tener al menos un color y un talle.",
    });
  }

  const precioNumerico = Number(precio);

  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    return res.status(400).json({
      mensaje: "El precio debe ser un número mayor a 0.",
    });
  }

  if (typeof activo !== "boolean") {
    return res.status(400).json({
      mensaje: "El estado del producto no es válido.",
    });
  }

  const imagen = req.file
    ? `imagenes/${crearNombreSeguro(nombre)}/${req.file.filename}`
    : null;

  try {
    const resultado = await pool.query(
      `
        INSERT INTO productos (
          nombre,
          categoria,
          colores,
          talles,
          precio,
          descripcion,
          lavado,
          uso,
          img,
          activo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          nombre,
          categoria,
          colores,
          talles,
          precio,
          descripcion,
          lavado,
          uso,
          img,
          activo,
          created_at
      `,
      [
        nombre.trim(),
        categoria.trim(),
        coloresParseados,
        tallesParseados,
        precioNumerico,
        descripcion?.trim() || null,
        lavado?.trim() || null,
        uso?.trim() || null,
        imagen,
        activo,
      ],
    );

    return res.status(201).json({
      mensaje: "Producto creado correctamente.",
      producto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear producto:", error);

    return res.status(500).json({
      mensaje: "Error al crear el producto.",
    });
  }
};

const actualizarProducto = async (req, res) => {
  const { id } = req.params;

  let coloresParseados;
  let tallesParseados;

  try {
    coloresParseados =
      typeof req.body.colores === "string"
        ? JSON.parse(req.body.colores)
        : req.body.colores;

    tallesParseados =
      typeof req.body.talles === "string"
        ? JSON.parse(req.body.talles)
        : req.body.talles;
  } catch (error) {
    return res.status(400).json({
      mensaje: "Los colores o talles no tienen un formato válido.",
    });
  }

  const { nombre, categoria, precio, descripcion, lavado, uso } = req.body;

  const activo =
    typeof req.body.activo === "string"
      ? req.body.activo === "true"
      : req.body.activo;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({
      mensaje: "El ID del producto no es válido.",
    });
  }

  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    typeof categoria !== "string" ||
    !categoria.trim()
  ) {
    return res.status(400).json({
      mensaje: "El nombre y la categoría son obligatorios.",
    });
  }

  if (
    !Array.isArray(coloresParseados) ||
    coloresParseados.length === 0 ||
    !Array.isArray(tallesParseados) ||
    tallesParseados.length === 0
  ) {
    return res.status(400).json({
      mensaje: "El producto debe tener al menos un color y un talle.",
    });
  }

  const precioNumerico = Number(precio);

  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    return res.status(400).json({
      mensaje: "El precio debe ser un número mayor a 0.",
    });
  }

  if (typeof activo !== "boolean") {
    return res.status(400).json({
      mensaje: "El estado del producto no es válido.",
    });
  }

  try {
    const productoActual = await pool.query(
      `
        SELECT img
        FROM productos
        WHERE id = $1
      `,
      [Number(id)],
    );

    if (productoActual.rowCount === 0) {
      return res.status(404).json({
        mensaje: "Producto no encontrado.",
      });
    }

    const imagenActual = productoActual.rows[0].img;

    const imagen = req.file
      ? `imagenes/${crearNombreSeguro(nombre)}/${req.file.filename}`
      : imagenActual;

    const resultado = await pool.query(
      `
        UPDATE productos
        SET
          nombre = $1,
          categoria = $2,
          colores = $3,
          talles = $4,
          precio = $5,
          descripcion = $6,
          lavado = $7,
          uso = $8,
          img = $9,
          activo = $10
        WHERE id = $11
        RETURNING
          id,
          nombre,
          categoria,
          colores,
          talles,
          precio,
          descripcion,
          lavado,
          uso,
          img,
          activo,
          created_at
      `,
      [
        nombre.trim(),
        categoria.trim(),
        coloresParseados,
        tallesParseados,
        precioNumerico,
        descripcion?.trim() || null,
        lavado?.trim() || null,
        uso?.trim() || null,
        imagen,
        activo,
        Number(id),
      ],
    );

    return res.json({
      mensaje: "Producto actualizado correctamente.",
      producto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);

    return res.status(500).json({
      mensaje: "Error al actualizar el producto.",
    });
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductosAdmin,
  crearProducto,
  actualizarProducto,
};
