const pool = require("../config/database");

const obtenerStock = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        ps.id,
        ps.producto_id,
        p.nombre,
        p.img,
        ps.talle,
        ps.color,
        ps.cantidad
      FROM producto_stock ps
      INNER JOIN productos p
        ON p.id = ps.producto_id
      ORDER BY ps.producto_id, ps.talle, ps.color
    `);

    return res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener stock:", error);

    return res.status(500).json({
      mensaje: "Error al obtener el stock.",
    });
  }
};

const obtenerStockPublico = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        producto_id,
        talle,
        color,
        cantidad
      FROM producto_stock
      ORDER BY producto_id, talle, color
    `);

    return res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener stock público:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener el stock.",
    });
  }
};

const actualizarStock = async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return res.status(400).json({
      mensaje: "ID de stock no válido.",
    });
  }

  const cantidadNumerica = Number(cantidad);

  if (!Number.isInteger(cantidadNumerica) || cantidadNumerica < 0) {
    return res.status(400).json({
      mensaje: "La cantidad debe ser un número entero mayor o igual a 0.",
    });
  }

  try {
    const resultado = await pool.query(
      `
        UPDATE producto_stock
        SET cantidad = $1
        WHERE id = $2
        RETURNING
          id,
          producto_id,
          talle,
          color,
          cantidad
      `,
      [cantidadNumerica, Number(id)],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Registro de stock no encontrado.",
      });
    }

    return res.json({
      mensaje: "Stock actualizado correctamente.",
      stock: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar stock:", error);

    return res.status(500).json({
      mensaje: "No se pudo actualizar el stock.",
    });
  }
};

module.exports = {
  obtenerStock,
  obtenerStockPublico,
  actualizarStock,
};
