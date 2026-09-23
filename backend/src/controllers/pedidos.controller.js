const pool = require("../config/database");

const crearPedido = async (req, res) => {
  const {
    nombre,
    apellido,
    dni,
    telefono,
    tipo_entrega,
    codigo_postal,
    calle,
    numero,
    departamento,
    barrio,
    localidad,
    medio_pago,
    items,
  } = req.body;

  // =========================
  // VALIDACIONES GENERALES
  // =========================

  if (
    typeof nombre !== "string" ||
    typeof apellido !== "string" ||
    typeof dni !== "string" ||
    typeof telefono !== "string" ||
    typeof tipo_entrega !== "string" ||
    typeof calle !== "string" ||
    typeof numero !== "string" ||
    typeof localidad !== "string" ||
    typeof medio_pago !== "string" ||
    !Array.isArray(items)
  ) {
    return res.status(400).json({
      mensaje: "Los datos enviados no son válidos",
    });
  }

  // =========================
  // LONGITUDES
  // =========================

  const camposConLongitudInvalida = [];

  if (nombre.trim().length < 2 || nombre.trim().length > 100) {
    camposConLongitudInvalida.push("nombre");
  }

  if (apellido.trim().length < 2 || apellido.trim().length > 100) {
    camposConLongitudInvalida.push("apellido");
  }

  if (dni.trim().length < 7 || dni.trim().length > 20) {
    camposConLongitudInvalida.push("dni");
  }

  if (telefono.trim().length < 6 || telefono.trim().length > 30) {
    camposConLongitudInvalida.push("telefono");
  }

  if (calle.trim().length < 2 || calle.trim().length > 150) {
    camposConLongitudInvalida.push("calle");
  }

  if (numero.trim().length < 1 || numero.trim().length > 20) {
    camposConLongitudInvalida.push("numero");
  }

  if (localidad.trim().length < 2 || localidad.trim().length > 100) {
    camposConLongitudInvalida.push("localidad");
  }

  if (camposConLongitudInvalida.length > 0) {
    return res.status(400).json({
      mensaje: "Uno o más datos tienen una longitud no válida",
      campos: camposConLongitudInvalida,
    });
  }

  if (departamento !== undefined && departamento !== null) {
    if (typeof departamento !== "string" || departamento.trim().length > 50) {
      return res.status(400).json({
        mensaje: "El departamento no es válido",
      });
    }
  }

  if (barrio !== undefined && barrio !== null) {
    if (typeof barrio !== "string" || barrio.trim().length > 100) {
      return res.status(400).json({
        mensaje: "El barrio no es válido",
      });
    }
  }

  if (codigo_postal !== undefined && codigo_postal !== null) {
    if (typeof codigo_postal !== "string" || codigo_postal.trim().length > 20) {
      return res.status(400).json({
        mensaje: "El código postal no es válido",
      });
    }
  }

  // =========================
  // TIPO DE ENTREGA
  // =========================

  const tiposEntregaPermitidos = ["via_cargo", "retiro"];

  if (!tiposEntregaPermitidos.includes(tipo_entrega)) {
    return res.status(400).json({
      mensaje: "Tipo de entrega no válido",
    });
  }

  // Vía Cargo requiere código postal.
  if (
    tipo_entrega === "via_cargo" &&
    (!codigo_postal || codigo_postal.trim() === "")
  ) {
    return res.status(400).json({
      mensaje: "El código postal es obligatorio para Vía Cargo",
    });
  }

  // Retiro no necesita código postal.
  if (tipo_entrega === "retiro" && codigo_postal) {
    return res.status(400).json({
      mensaje: "El código postal no corresponde para retiro",
    });
  }

  // =========================
  // FORMA DE PAGO
  // =========================

  const mediosPagoPermitidos = [
    "transferencia",
    "sena_transferencia_saldo_efectivo",
  ];

  if (!mediosPagoPermitidos.includes(medio_pago)) {
    return res.status(400).json({
      mensaje: "Medio de pago no válido",
    });
  }

  // Vía Cargo = 100% transferencia.
  if (tipo_entrega === "via_cargo" && medio_pago !== "transferencia") {
    return res.status(400).json({
      mensaje: "La forma de pago no corresponde con Vía Cargo",
    });
  }

  // Retiro = 25% transferencia + 75% efectivo.
  if (
    tipo_entrega === "retiro" &&
    medio_pago !== "sena_transferencia_saldo_efectivo"
  ) {
    return res.status(400).json({
      mensaje: "La forma de pago no corresponde con retiro",
    });
  }

  // =========================
  // ITEMS
  // =========================

  if (items.length === 0) {
    return res.status(400).json({
      mensaje: "El pedido debe contener al menos un producto",
    });
  }

  // Límite para evitar pedidos artificialmente enormes.
  if (items.length > 50) {
    return res.status(400).json({
      mensaje: "El pedido contiene demasiados productos",
    });
  }

  let totalCalculado = 0;

  for (const item of items) {
    if (!item || typeof item !== "object") {
      return res.status(400).json({
        mensaje: "Uno de los productos no es válido",
      });
    }

    const { producto_id, talle, color, cantidad } = item;

    // -------------------------
    // ID del producto
    // -------------------------

    if (!Number.isInteger(producto_id) || producto_id <= 0) {
      return res.status(400).json({
        mensaje: "El producto seleccionado no es válido",
      });
    }

    // -------------------------
    // Datos seleccionados
    // -------------------------

    if (
      typeof talle !== "string" ||
      talle.trim().length < 1 ||
      talle.trim().length > 20
    ) {
      return res.status(400).json({
        mensaje: "El talle de uno de los productos no es válido",
      });
    }

    if (
      typeof color !== "string" ||
      color.trim().length < 1 ||
      color.trim().length > 50
    ) {
      return res.status(400).json({
        mensaje: "El color de uno de los productos no es válido",
      });
    }

    // -------------------------
    // Cantidad
    // -------------------------

    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 100) {
      return res.status(400).json({
        mensaje: "La cantidad de un producto no es válida",
      });
    }

    // -------------------------
    // Buscar producto en DB
    // -------------------------

    const productoResult = await pool.query(
      `
    SELECT
      id,
      nombre,
      colores,
      talles,
      precio,
      activo
    FROM productos
    WHERE id = $1
    `,
      [producto_id],
    );

    if (productoResult.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El producto seleccionado no existe",
      });
    }

    const productoDB = productoResult.rows[0];

    // -------------------------
    // Producto activo
    // -------------------------

    if (!productoDB.activo) {
      return res.status(400).json({
        mensaje: "El producto seleccionado no está disponible",
      });
    }

    // -------------------------
    // Validar talle
    // -------------------------

    if (!productoDB.talles.includes(talle.trim())) {
      return res.status(400).json({
        mensaje: "El talle seleccionado no está disponible para este producto",
      });
    }

    // -------------------------
    // Validar color
    // -------------------------

    if (!productoDB.colores.includes(color.trim())) {
      return res.status(400).json({
        mensaje: "El color seleccionado no está disponible para este producto",
      });
    }

    // -------------------------
    // Precio real de DB
    // -------------------------

    const precioUnitario = Number(productoDB.precio);

    if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
      return res.status(500).json({
        mensaje: "El precio del producto no es válido en la base de datos",
      });
    }

    // -------------------------
    // Calcular subtotal
    // -------------------------

    const subtotalCalculado = Math.round(cantidad * precioUnitario * 100) / 100;

    totalCalculado += subtotalCalculado;
  }

  // Redondeamos el total final a dos decimales.
  totalCalculado = Math.round(totalCalculado * 100) / 100;

  if (totalCalculado <= 0) {
    return res.status(400).json({
      mensaje: "El total del pedido debe ser mayor a cero",
    });
  }

  // =========================
  // CALCULAR PAGO EN BACKEND
  // =========================

  let montoTransferencia = 0;
  let saldoEfectivo = 0;

  if (tipo_entrega === "retiro") {
    montoTransferencia = Math.round(totalCalculado * 0.25 * 100) / 100;

    saldoEfectivo = Math.round(totalCalculado * 0.75 * 100) / 100;
  } else {
    montoTransferencia = totalCalculado;
    saldoEfectivo = 0;
  }

  // Verificación adicional.
  const sumaPago = Math.round((montoTransferencia + saldoEfectivo) * 100) / 100;

  if (sumaPago !== totalCalculado) {
    return res.status(400).json({
      mensaje: "No se pudo calcular correctamente el pago",
    });
  }

  // =========================
  // GUARDAR PEDIDO
  // =========================

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =========================
    // VERIFICAR Y RESERVAR STOCK
    // =========================

    for (const item of items) {
      const stockResult = await client.query(
        `
        SELECT
          id,
          cantidad
        FROM producto_stock
        WHERE producto_id = $1
          AND talle = $2
          AND color = $3
        FOR UPDATE
        `,
        [item.producto_id, item.talle.trim(), item.color.trim()],
      );

      if (stockResult.rows.length === 0) {
        const errorStock = new Error(
          `No hay stock disponible para el producto ${item.producto_id}, talle ${item.talle}, color ${item.color}.`,
        );

        errorStock.codigo = "STOCK_ERROR";

        throw errorStock;
      }

      const stock = stockResult.rows[0];

      if (stock.cantidad < item.cantidad) {
        const errorStock = new Error(
          `No hay suficiente stock para el producto ${item.producto_id}, talle ${item.talle}, color ${item.color}.`,
        );

        errorStock.codigo = "STOCK_ERROR";

        throw errorStock;
      }

      await client.query(
        `
        UPDATE producto_stock
        SET cantidad = cantidad - $1
        WHERE id = $2
        `,
        [item.cantidad, stock.id],
      );
    }

    const pedidoResult = await client.query(
      `
      INSERT INTO pedidos (
        nombre,
        apellido,
        dni,
        telefono,
        tipo_entrega,
        codigo_postal,
        calle,
        numero,
        departamento,
        barrio,
        localidad,
        medio_pago,
        total,
        monto_transferencia,
        saldo_efectivo
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )
      RETURNING id, created_at
      `,
      [
        nombre.trim(),
        apellido.trim(),
        dni.trim(),
        telefono.trim(),
        tipo_entrega,
        codigo_postal ? codigo_postal.trim() : null,
        calle.trim(),
        numero.trim(),
        departamento ? departamento.trim() : null,
        barrio ? barrio.trim() : null,
        localidad.trim(),
        medio_pago,
        totalCalculado,
        montoTransferencia,
        saldoEfectivo,
      ],
    );

    const pedido = pedidoResult.rows[0];

    // =========================
    // GUARDAR ITEMS
    // =========================

    for (const item of items) {
      const productoResult = await client.query(
        `
    SELECT
      id,
      nombre,
      precio
    FROM productos
    WHERE id = $1
    `,
        [item.producto_id],
      );

      if (productoResult.rows.length === 0) {
        throw new Error("Producto no encontrado al guardar el pedido");
      }

      const productoDB = productoResult.rows[0];

      const precioUnitario = Number(productoDB.precio);

      const subtotalCalculado =
        Math.round(item.cantidad * precioUnitario * 100) / 100;

      await client.query(
        `
    INSERT INTO pedido_items (
      pedido_id,
      producto,
      talle,
      color,
      cantidad,
      precio_unitario,
      subtotal
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
        [
          pedido.id,
          productoDB.nombre,
          item.talle.trim(),
          item.color.trim(),
          item.cantidad,
          precioUnitario,
          subtotalCalculado,
        ],
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Pedido creado correctamente",
      pedidoId: pedido.id,
      fecha: pedido.created_at,
      total: totalCalculado,
      monto_transferencia: montoTransferencia,
      saldo_efectivo: saldoEfectivo,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al crear pedido:", error);

    if (error.codigo === "STOCK_ERROR") {
      return res.status(409).json({
        mensaje: error.message,
      });
    }

    return res.status(500).json({
      mensaje: "No se pudo crear el pedido",
    });
  } finally {
    client.release();
  }
};

// =========================
// OBTENER TODOS LOS PEDIDOS
// =========================

const obtenerPedidos = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM pedidos
      ORDER BY created_at DESC
      `,
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);

    return res.status(500).json({
      mensaje: "No se pudieron obtener los pedidos",
    });
  }
};

// =========================
// OBTENER PEDIDO POR ID
// =========================

const obtenerPedidoPorId = async (req, res) => {
  const { id } = req.params;

  // Validar que el ID sea un entero positivo.
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return res.status(400).json({
      mensaje: "ID de pedido no válido",
    });
  }

  try {
    const pedidoResult = await pool.query(
      `
      SELECT *
      FROM pedidos
      WHERE id = $1
      `,
      [id],
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT *
      FROM pedido_items
      WHERE pedido_id = $1
      ORDER BY id
      `,
      [id],
    );

    return res.json({
      pedido: pedidoResult.rows[0],
      productos: itemsResult.rows,
    });
  } catch (error) {
    console.error("Error al obtener pedido:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener el pedido",
    });
  }
};

// =========================
// ACTUALIZAR ESTADO
// =========================

const actualizarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  // Validar ID.
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return res.status(400).json({
      mensaje: "ID de pedido no válido",
    });
  }

  const estadosPermitidos = [
    "pendiente_transferencia",
    "transferencia_recibida",
    "preparando",
    "listo",
    "finalizado",
    "cancelado",
  ];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      mensaje: "Estado de pedido no válido",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener el estado actual del pedido.
    const pedidoResult = await client.query(
      `
      SELECT id, estado
      FROM pedidos
      WHERE id = $1
      FOR UPDATE
      `,
      [id],
    );

    if (pedidoResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "Pedido no encontrado",
      });
    }

    const pedido = pedidoResult.rows[0];

    // Si el pedido ya estaba cancelado, no volvemos a devolver stock.
    if (pedido.estado === "cancelado" && estado === "cancelado") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        mensaje: "El pedido ya está cancelado",
      });
    }

    // Si se está cancelando el pedido, devolver las cantidades al stock.
    if (estado === "cancelado" && pedido.estado !== "cancelado") {
      const itemsResult = await client.query(
        `
  SELECT
    producto,
    talle,
    color,
    cantidad
  FROM pedido_items
  WHERE pedido_id = $1
  ORDER BY id
  `,
        [id],
      );

      for (const item of itemsResult.rows) {
        const productoResult = await client.query(
          `
    SELECT id
    FROM productos
    WHERE nombre = $1
    `,
          [item.producto],
        );

        if (productoResult.rows.length === 0) {
          throw new Error(
            `No se encontró el producto "${item.producto}" en la base de datos.`,
          );
        }

        const productoId = productoResult.rows[0].id;

        const stockResult = await client.query(
          `
    UPDATE producto_stock
    SET cantidad = cantidad + $1
    WHERE producto_id = $2
      AND talle = $3
      AND color = $4
    RETURNING id, cantidad
    `,
          [item.cantidad, productoId, item.talle, item.color],
        );

        if (stockResult.rows.length === 0) {
          throw new Error(
            `No se encontró el registro de stock para el producto ${productoId}, talle ${item.talle}, color ${item.color}.`,
          );
        }
      }
    }

    // Actualizar estado del pedido.
    const result = await client.query(
      `
      UPDATE pedidos
      SET estado = $1
      WHERE id = $2
      RETURNING *
      `,
      [estado, id],
    );

    await client.query("COMMIT");

    return res.json({
      mensaje:
        estado === "cancelado"
          ? "Pedido cancelado y stock devuelto correctamente"
          : "Estado actualizado correctamente",
      pedido: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al actualizar estado:", error);

    return res.status(500).json({
      mensaje: "No se pudo actualizar el estado",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
};
