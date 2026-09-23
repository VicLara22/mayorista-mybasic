const API_URL = "https://mayorista-mybasic.onrender.com/api/pedidos";
const PRODUCTOS_API_URL = "https://mayorista-mybasic.onrender.com/api/productos/admin";
const STOCK_API_URL = "https://mayorista-mybasic.onrender.com/api/stock";

let pedidoActualId = null;
let pedidos = [];
let productosAdmin = [];

const money = (value) =>
  new Intl.NumberFormat("es-AR").format(Number(value) || 0);

const fecha = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

function nombreEntrega(tipo) {
  if (tipo === "via_cargo") {
    return "Vía Cargo";
  }

  if (tipo === "retiro") {
    return "Retiro";
  }

  return tipo || "-";
}

function nombreEstado(estado) {
  const estados = {
    pendiente_transferencia: "Pendiente de transferencia",
    transferencia_recibida: "Transferencia recibida",
    preparando: "Preparando",
    listo: "Listo / Enviado",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  };

  return estados[estado] || estado || "-";
}

function configurarEstadosPedido(estadoActual) {
  const select = document.getElementById("detalle-estado-select");

  const transicionesPermitidas = {
    pendiente_transferencia: ["transferencia_recibida", "cancelado"],

    transferencia_recibida: ["preparando", "cancelado"],

    preparando: ["listo", "cancelado"],

    listo: ["finalizado"],

    finalizado: [],

    cancelado: [],
  };

  const opcionesPermitidas = transicionesPermitidas[estadoActual] || [];

  select.innerHTML = "";

  // Mostrar el estado actual como opción informativa.
  const opcionActual = document.createElement("option");

  opcionActual.value = estadoActual;
  opcionActual.textContent = nombreEstado(estadoActual);
  opcionActual.selected = true;

  select.appendChild(opcionActual);

  // Agregar únicamente las transiciones permitidas.
  opcionesPermitidas.forEach((estado) => {
    const opcion = document.createElement("option");

    opcion.value = estado;
    opcion.textContent = nombreEstado(estado);

    select.appendChild(opcion);
  });
}

function claseEstado(estado) {
  const clases = {
    pendiente_transferencia: "bg-yellow-100 text-yellow-800",
    transferencia_recibida: "bg-blue-100 text-blue-800",
    preparando: "bg-purple-100 text-purple-800",
    listo: "bg-green-100 text-green-800",
    finalizado: "bg-gray-100 text-gray-700",
    cancelado: "bg-red-100 text-red-800",
  };

  return clases[estado] || "bg-gray-100 text-gray-700";
}

async function cargarPedidos() {
  const cargando = document.getElementById("cargando");
  const contenedor = document.getElementById("contenedor-pedidos");
  const sinPedidos = document.getElementById("sin-pedidos");
  const mensajeError = document.getElementById("mensaje-error");

  try {
    mensajeError.classList.add("hidden");

    const respuesta = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${obtenerToken()}`,
      },
    });

    if (!respuesta.ok) {
      throw new Error("No se pudieron obtener los pedidos.");
    }

    pedidos = await respuesta.json();

    cargando.classList.add("hidden");

    actualizarResumen(pedidos);

    if (pedidos.length === 0) {
      sinPedidos.classList.remove("hidden");
      contenedor.classList.add("hidden");
      return;
    }

    sinPedidos.classList.add("hidden");
    contenedor.classList.remove("hidden");

    filtrarPedidos();
  } catch (error) {
    console.error("Error al cargar pedidos:", error);

    cargando.classList.add("hidden");
    contenedor.classList.add("hidden");
    sinPedidos.classList.add("hidden");

    mensajeError.textContent =
      "No se pudieron cargar los pedidos. Verificá que el backend esté funcionando.";

    mensajeError.classList.remove("hidden");
  }
}

async function cargarProductosAdmin() {
  try {
    const respuesta = await fetch(PRODUCTOS_API_URL, {
      headers: {
        Authorization: `Bearer ${obtenerToken()}`,
      },
    });

    if (!respuesta.ok) {
      throw new Error("No se pudieron obtener los productos.");
    }

    const productos = await respuesta.json();

    productosAdmin = productos;

    renderizarProductos(productos);
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

async function cargarStock() {
  const listaStock = document.getElementById("lista-stock");
  const sinStock = document.getElementById("sin-stock");

  if (!listaStock || !sinStock) {
    return;
  }

  try {
    const respuesta = await fetch(STOCK_API_URL, {
      headers: {
        Authorization: `Bearer ${obtenerToken()}`,
      },
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el stock.");
    }

    const stock = await respuesta.json();

    listaStock.innerHTML = "";

    if (stock.length === 0) {
      sinStock.classList.remove("hidden");
      return;
    }

    sinStock.classList.add("hidden");

    stock.forEach((item) => {
      const fila = document.createElement("tr");

      fila.className = "border-b border-gray-100";

      fila.innerHTML = `
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            ${
              item.img
                ? `
                  <img
                    src="../${escapeHtml(item.img)}"
                    alt="${escapeHtml(item.nombre)}"
                    class="h-10 w-10 rounded-lg object-cover"
                  >
                `
                : `
                  <div class="h-10 w-10 rounded-lg bg-gray-100"></div>
                `
            }

            <span class="font-semibold text-gray-900">
              ${escapeHtml(item.nombre)}
            </span>
          </div>
        </td>

        <td class="px-4 py-3 text-sm text-gray-700">
          ${escapeHtml(item.talle)}
        </td>

        <td class="px-4 py-3 text-sm text-gray-700">
          ${escapeHtml(item.color)}
        </td>

        <td class="px-4 py-3">
          <input
            type="number"
            min="0"
            value="${escapeHtml(item.cantidad)}"
            class="stock-cantidad w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            data-id="${item.id}"
          >
        </td>

        <td class="px-4 py-3">
          <button
            type="button"
            class="guardar-stock rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800"
            data-id="${item.id}"
          >
            Guardar
          </button>
        </td>
      `;

      listaStock.appendChild(fila);
    });

    configurarEventosStock();
  } catch (error) {
    console.error("Error al cargar stock:", error);
  }
}

function configurarEventosStock() {
  document.querySelectorAll(".guardar-stock").forEach((boton) => {
    boton.addEventListener("click", () => {
      const stockId = Number(boton.dataset.id);

      const input = document.querySelector(
        `.stock-cantidad[data-id="${stockId}"]`,
      );

      if (!input) {
        return;
      }

      actualizarStock(stockId, input.value, boton);
    });
  });
}

async function actualizarStock(id, cantidad, boton) {
  const cantidadNumerica = Number(cantidad);

  if (!Number.isInteger(cantidadNumerica) || cantidadNumerica < 0) {
    window.alert("La cantidad debe ser un número entero mayor o igual a 0.");

    return;
  }

  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const respuesta = await fetch(`${STOCK_API_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obtenerToken()}`,
      },
      body: JSON.stringify({
        cantidad: cantidadNumerica,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo actualizar el stock.");
    }

    boton.textContent = "Guardado";

    await cargarStock();

    setTimeout(() => {
      boton.textContent = "Guardar";
    }, 1000);
  } catch (error) {
    console.error("Error al actualizar stock:", error);

    window.alert(error.message || "No se pudo actualizar el stock.");

    boton.textContent = "Guardar";
  } finally {
    boton.disabled = false;
  }
}

function renderizarProductos(productos) {
  const listaProductos = document.getElementById("lista-productos");
  const sinProductos = document.getElementById("sin-productos");

  if (!listaProductos || !sinProductos) {
    return;
  }

  listaProductos.innerHTML = "";

  if (productos.length === 0) {
    sinProductos.classList.remove("hidden");
    return;
  }

  sinProductos.classList.add("hidden");

  productos.forEach((producto) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td class="whitespace-nowrap px-6 py-4">
        <div class="flex items-center gap-3">
          ${
            producto.img
              ? `
                <img
                  src="https://mayorista-mybasic.onrender.com/${escapeHtml(producto.img)}"
                  alt="${escapeHtml(producto.nombre)}"
                  class="h-12 w-12 rounded-lg object-cover"
                >
              `
              : `
                <div class="h-12 w-12 rounded-lg bg-gray-100"></div>
              `
          }

          <div>
            <p class="font-semibold text-gray-900">
              ${escapeHtml(producto.nombre)}
            </p>

            <p class="text-xs text-gray-500">
              ID: ${producto.id}
            </p>
          </div>
        </div>
      </td>

      <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
        ${escapeHtml(producto.categoria)}
      </td>

      <td class="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
        ${money(producto.precio)}
      </td>

      <td class="px-6 py-4 text-sm text-gray-700">
        ${producto.talles.map((talle) => escapeHtml(talle)).join(", ")}
      </td>

      <td class="px-6 py-4 text-sm text-gray-700">
        ${producto.colores.length} colores
      </td>

 <td class="whitespace-nowrap px-6 py-4">
  <div class="flex items-center gap-3">
    <span
      class="${
        producto.activo
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      } inline-flex rounded-full px-3 py-1 text-xs font-semibold"
    >
      ${producto.activo ? "Activo" : "Inactivo"}
    </span>

    <button
      type="button"
      class="editar-producto rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800"
      data-id="${producto.id}"
    >
      Editar
    </button>

    <button
      type="button"
      class="${
        producto.activo
          ? "desactivar-producto border border-red-300 text-red-600 hover:bg-red-50"
          : "activar-producto bg-green-600 text-white hover:bg-green-700"
      } rounded-full px-4 py-2 text-xs font-bold"
      data-id="${producto.id}"
    >
      ${producto.activo ? "Desactivar" : "Activar"}
    </button>
  </div>
</td> `;
    listaProductos.appendChild(fila);
  });
  configurarEventosProductos();
}

async function guardarProducto(event) {
  event.preventDefault();

  const id = document.getElementById("producto-id").value;

  const boton = document.getElementById("guardar-producto");
  const mensaje = document.getElementById("mensaje-producto");

  const datos = {
    nombre: document.getElementById("producto-nombre").value.trim(),
    categoria: document.getElementById("producto-categoria").value.trim(),
    precio: Number(document.getElementById("producto-precio").value),
    talles: document
      .getElementById("producto-talles")
      .value.split(",")
      .map((talle) => talle.trim())
      .filter(Boolean),
    colores: document
      .getElementById("producto-colores")
      .value.split(",")
      .map((color) => color.trim())
      .filter(Boolean),
    descripcion: document.getElementById("producto-descripcion").value.trim(),
    lavado: document.getElementById("producto-lavado").value.trim(),
    uso: document.getElementById("producto-uso").value.trim(),
    activo: true,
  };

  const archivoImagen = document.getElementById("producto-img").files[0];

  mensaje.classList.add("hidden");

  boton.disabled = true;
  boton.textContent = id ? "Guardando..." : "Creando...";

  try {
    const formData = new FormData();

    formData.append("nombre", datos.nombre);
    formData.append("categoria", datos.categoria);
    formData.append("precio", datos.precio);
    formData.append("talles", JSON.stringify(datos.talles));
    formData.append("colores", JSON.stringify(datos.colores));
    formData.append("descripcion", datos.descripcion);
    formData.append("lavado", datos.lavado);
    formData.append("uso", datos.uso);

    const activo = id
      ? (productosAdmin.find((producto) => producto.id === Number(id))
          ?.activo ?? true)
      : true;

    formData.append("activo", String(activo));

    if (archivoImagen) {
      formData.append("imagen", archivoImagen);
    }

    const url = id
      ? `${PRODUCTOS_API_URL.replace("/admin", "")}/${id}`
      : PRODUCTOS_API_URL.replace("/admin", "");

    const respuesta = await fetch(url, {
      method: id ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${obtenerToken()}`,
      },
      body: formData,
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo guardar el producto.");
    }

    await cargarProductosAdmin();

    document.getElementById("modal-producto").classList.add("hidden");

    window.alert(
      id
        ? "Producto actualizado correctamente."
        : "Producto creado correctamente.",
    );
  } catch (error) {
    console.error("Error al guardar producto:", error);

    mensaje.textContent = error.message || "No se pudo guardar el producto.";

    mensaje.className = "mt-4 text-center text-sm font-semibold text-red-600";

    mensaje.classList.remove("hidden");
  } finally {
    boton.disabled = false;
    boton.textContent = id ? "Guardar cambios" : "Crear producto";
  }
}

async function cambiarEstadoProducto(producto) {
  const accion = producto.activo ? "desactivar" : "activar";

  const confirmado = window.confirm(
    `¿Querés ${accion} el producto "${producto.nombre}"?`,
  );

  if (!confirmado) {
    return;
  }

  try {
    const respuesta = await fetch(
      `${PRODUCTOS_API_URL.replace("/admin", "")}/${producto.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obtenerToken()}`,
        },
        body: JSON.stringify({
          nombre: producto.nombre,
          categoria: producto.categoria,
          colores: producto.colores,
          talles: producto.talles,
          precio: Number(producto.precio),
          descripcion: producto.descripcion,
          lavado: producto.lavado,
          uso: producto.uso,
          img: producto.img,
          activo: !producto.activo,
        }),
      },
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje || "No se pudo actualizar el estado del producto.",
      );
    }

    await cargarProductosAdmin();
  } catch (error) {
    console.error("Error al cambiar el estado del producto:", error);

    window.alert(
      error.message || "No se pudo actualizar el estado del producto.",
    );
  }
}

function configurarEventosProductos() {
  const botonNuevoProducto = document.getElementById("nuevo-producto");

  if (botonNuevoProducto) {
    botonNuevoProducto.addEventListener("click", abrirModalNuevoProducto);
  }
  document.querySelectorAll(".editar-producto").forEach((boton) => {
    boton.addEventListener("click", () => {
      const productoId = Number(boton.dataset.id);

      const producto = productosAdmin.find((item) => item.id === productoId);

      if (!producto) {
        return;
      }

      abrirModalProducto(producto);
    });
  });

  document
    .querySelectorAll(".activar-producto, .desactivar-producto")
    .forEach((boton) => {
      boton.addEventListener("click", () => {
        const productoId = Number(boton.dataset.id);

        const producto = productosAdmin.find((item) => item.id === productoId);

        if (!producto) {
          return;
        }

        cambiarEstadoProducto(producto);
      });
    });
}

function abrirModalProducto(producto) {
  document.getElementById("producto-id").value = producto.id;
  document.getElementById("producto-nombre").value = producto.nombre;
  document.getElementById("producto-categoria").value = producto.categoria;
  document.getElementById("producto-precio").value = producto.precio;

  document.getElementById("producto-talles").value = producto.talles.join(", ");

  document.getElementById("producto-colores").value =
    producto.colores.join(", ");

  document.getElementById("producto-descripcion").value =
    producto.descripcion || "";

  document.getElementById("producto-lavado").value = producto.lavado || "";

  document.getElementById("producto-uso").value = producto.uso || "";

  document.getElementById("producto-img-actual").classList.add("hidden");

  const imagenActual = document.getElementById("producto-img-actual");

  if (producto.img) {
    imagenActual.textContent = `Imagen actual: ${producto.img}`;
    imagenActual.classList.remove("hidden");
  } else {
    imagenActual.textContent = "Este producto no tiene una imagen cargada.";
    imagenActual.classList.remove("hidden");
  }

  document.getElementById("mensaje-producto").classList.add("hidden");

  document.getElementById("modal-producto").classList.remove("hidden");
}

function abrirModalNuevoProducto() {
  document.getElementById("producto-id").value = "";
  document.getElementById("producto-nombre").value = "";
  document.getElementById("producto-categoria").value = "";
  document.getElementById("producto-precio").value = "";
  document.getElementById("producto-talles").value = "";
  document.getElementById("producto-colores").value = "";
  document.getElementById("producto-descripcion").value = "";
  document.getElementById("producto-lavado").value = "";
  document.getElementById("producto-uso").value = "";
  document.getElementById("producto-img-actual").classList.add("hidden");

  document.getElementById("mensaje-producto").classList.add("hidden");

  document.getElementById("guardar-producto").textContent = "Crear producto";

  document.getElementById("modal-producto").classList.remove("hidden");
}

function actualizarResumen(pedidos) {
  const pendientes = pedidos.filter(
    (pedido) => pedido.estado === "pendiente_transferencia",
  );

  const preparando = pedidos.filter((pedido) => pedido.estado === "preparando");

  const listos = pedidos.filter((pedido) => pedido.estado === "listo");

  const total = pedidos.reduce(
    (acumulado, pedido) => acumulado + Number(pedido.total || 0),
    0,
  );

  document.getElementById("cantidad-pedidos").textContent = pedidos.length;

  document.getElementById("cantidad-pendientes").textContent =
    pendientes.length;

  document.getElementById("cantidad-preparando").textContent =
    preparando.length;

  document.getElementById("cantidad-listos").textContent = listos.length;

  document.getElementById("total-vendido").textContent = `$${money(total)}`;
}

function renderizarPedidos(pedidos) {
  const lista = document.getElementById("lista-pedidos");

  lista.innerHTML = "";

  pedidos.forEach((pedido) => {
    const fila = document.createElement("tr");

    fila.className = "transition hover:bg-gray-50";

    fila.innerHTML = `
      <td class="px-5 py-4">
        <span class="font-black">
          #${escapeHtml(pedido.id)}
        </span>
      </td>

      <td class="px-5 py-4">
        <span class="text-sm text-gray-600">
          ${escapeHtml(fecha(pedido.created_at))}
        </span>
      </td>

      <td class="px-5 py-4">
        <div>
          <p class="font-bold">
            ${escapeHtml(pedido.nombre)}
            ${escapeHtml(pedido.apellido)}
          </p>

          <p class="mt-1 text-sm text-gray-500">
            ${escapeHtml(pedido.telefono)}
          </p>
        </div>
      </td>

      <td class="px-5 py-4">
        <span class="text-sm font-semibold">
          ${escapeHtml(nombreEntrega(pedido.tipo_entrega))}
        </span>
      </td>

      <td class="px-5 py-4">
        <span class="font-black">
          $${money(pedido.total)}
        </span>
      </td>

      <td class="px-5 py-4">
        <span
          class="inline-flex rounded-full px-3 py-1 text-xs font-bold ${claseEstado(
            pedido.estado,
          )}"
        >
          ${escapeHtml(nombreEstado(pedido.estado))}
        </span>
      </td>

      <td class="px-5 py-4">
        <button
          type="button"
          data-pedido-id="${escapeHtml(pedido.id)}"
          class="ver-pedido rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800"
        >
          Ver pedido
        </button>
      </td>
    `;

    lista.appendChild(fila);
  });
}

function filtrarPedidos() {
  const texto = document
    .getElementById("buscar-pedido")
    .value.trim()
    .toLowerCase();

  const estado = document.getElementById("filtro-estado").value;

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const coincideTexto =
      !texto ||
      pedido.nombre.toLowerCase().includes(texto) ||
      pedido.apellido.toLowerCase().includes(texto) ||
      pedido.dni.toLowerCase().includes(texto);

    const coincideEstado = estado === "todos" || pedido.estado === estado;

    return coincideTexto && coincideEstado;
  });

  renderizarPedidos(pedidosFiltrados);
}

async function abrirDetallePedido(id) {
  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${obtenerToken()}`,
      },
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el pedido.");
    }

    const resultado = await respuesta.json();

    mostrarDetallePedido(resultado.pedido, resultado.productos);

    document.getElementById("modal-pedido").classList.remove("hidden");

    document.body.classList.add("overflow-hidden");
  } catch (error) {
    console.error(error);

    alert("No se pudo cargar el detalle del pedido.");
  }
}

function mostrarDetallePedido(pedido, productos) {
  pedidoActualId = pedido.id;

  document.getElementById("modal-titulo").textContent = `Pedido #${pedido.id}`;

  document.getElementById("detalle-nombre").textContent =
    `${pedido.nombre} ${pedido.apellido}`;

  document.getElementById("detalle-dni").textContent = pedido.dni || "-";

  document.getElementById("detalle-telefono").textContent =
    pedido.telefono || "-";

  document.getElementById("detalle-pago").textContent =
    pedido.medio_pago === "transferencia"
      ? "Transferencia bancaria"
      : pedido.medio_pago || "-";

  document.getElementById("detalle-entrega").textContent = nombreEntrega(
    pedido.tipo_entrega,
  );

  document.getElementById("detalle-codigo-postal").textContent =
    pedido.codigo_postal || "No corresponde";

  const direccion = [
    pedido.calle,
    pedido.numero,
    pedido.departamento,
    pedido.barrio,
    pedido.localidad,
  ]
    .filter(Boolean)
    .join(", ");

  document.getElementById("detalle-direccion").textContent = direccion || "-";

  document.getElementById("detalle-total").textContent =
    `$${money(pedido.total)}`;

  document.getElementById("detalle-monto-transferencia").textContent =
    `$${money(pedido.monto_transferencia)}`;

  document.getElementById("detalle-saldo-efectivo").textContent =
    `$${money(pedido.saldo_efectivo)}`;

  configurarEstadosPedido(pedido.estado);

  configurarEstadosPedido(pedido.estado);

  const botonConfirmarTransferencia = document.getElementById(
    "confirmar-transferencia",
  );

  if (botonConfirmarTransferencia) {
    botonConfirmarTransferencia.classList.toggle(
      "hidden",
      pedido.estado !== "pendiente_transferencia",
    );
  }

  const cantidadProductos = productos.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0,
  );

  document.getElementById("detalle-cantidad-productos").textContent =
    `${cantidadProductos} ${cantidadProductos === 1 ? "unidad" : "unidades"}`;

  const productosContainer = document.getElementById("detalle-productos");

  productosContainer.innerHTML = "";

  productos.forEach((item) => {
    const producto = document.createElement("div");

    producto.className = "rounded-2xl border border-gray-200 p-4";

    producto.innerHTML = `
      <div class="flex items-start justify-between gap-4">

        <div>
          <p class="font-bold">
            ${escapeHtml(item.producto)}
          </p>

          <p class="mt-1 text-sm text-gray-500">
            Talle ${escapeHtml(item.talle)}
            · ${escapeHtml(item.color)}
          </p>

          <p class="mt-2 text-sm text-gray-600">
            ${escapeHtml(item.cantidad)} unidades
            × $${money(item.precio_unitario)}
          </p>
        </div>

        <p class="font-black">
          $${money(item.subtotal)}
        </p>

      </div>
    `;

    productosContainer.appendChild(producto);
  });
}

async function confirmarTransferencia() {
  if (!pedidoActualId) {
    return;
  }

  const confirmado = window.confirm(
    "¿Confirmás que recibiste la transferencia de este pedido?",
  );

  if (!confirmado) {
    return;
  }

  const boton = document.getElementById("confirmar-transferencia");

  boton.disabled = true;
  boton.textContent = "Confirmando...";

  try {
    const respuesta = await fetch(`${API_URL}/${pedidoActualId}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obtenerToken()}`,
      },
      body: JSON.stringify({
        estado: "transferencia_recibida",
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje || "No se pudo confirmar la transferencia.",
      );
    }

    await cargarPedidos();

    document.getElementById("modal-pedido").classList.add("hidden");

    window.alert("Transferencia confirmada correctamente.");
  } catch (error) {
    console.error("Error al confirmar transferencia:", error);

    window.alert(error.message || "No se pudo confirmar la transferencia.");
  } finally {
    boton.disabled = false;
    boton.textContent = "✓ Confirmar transferencia";
  }
}

async function guardarEstadoPedido() {
  if (!pedidoActualId) return;

  const select = document.getElementById("detalle-estado-select");
  const boton = document.getElementById("guardar-estado");
  const mensaje = document.getElementById("mensaje-estado");

  const nuevoEstado = select.value;

  boton.disabled = true;
  boton.textContent = "Guardando...";
  mensaje.classList.add("hidden");

  try {
    const respuesta = await fetch(`${API_URL}/${pedidoActualId}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${obtenerToken()}`,
      },
      body: JSON.stringify({
        estado: nuevoEstado,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo actualizar el estado.");
    }

    mensaje.textContent = "Estado actualizado correctamente.";

    mensaje.className = "mt-3 text-center text-sm font-semibold text-green-600";

    await cargarPedidos();

    if (nuevoEstado === "cancelado") {
      await cargarStock();
    }

    cerrarDetallePedido();
  } catch (error) {
    console.error(error);

    mensaje.textContent = "No se pudo actualizar el estado.";

    mensaje.className = "mt-3 text-center text-sm font-semibold text-red-600";
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar estado";
  }
}

function cerrarDetallePedido() {
  document.getElementById("modal-pedido").classList.add("hidden");

  document.body.classList.remove("overflow-hidden");
}

document.addEventListener("click", (event) => {
  const boton = event.target.closest(".ver-pedido");

  if (!boton) return;

  const id = boton.dataset.pedidoId;

  abrirDetallePedido(id);
});

document
  .getElementById("cerrar-modal")
  .addEventListener("click", cerrarDetallePedido);

document
  .getElementById("guardar-estado")
  .addEventListener("click", guardarEstadoPedido);

document
  .getElementById("confirmar-transferencia")
  .addEventListener("click", confirmarTransferencia);

document
  .getElementById("buscar-pedido")
  .addEventListener("input", filtrarPedidos);

document
  .getElementById("filtro-estado")
  .addEventListener("change", filtrarPedidos);

document
  .getElementById("actualizar-pedidos")
  .addEventListener("click", cargarPedidos);

document
  .getElementById("modal-overlay")
  .addEventListener("click", cerrarDetallePedido);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    cerrarDetallePedido();
  }
});

const formularioProducto = document.getElementById("formulario-producto");

if (formularioProducto) {
  formularioProducto.addEventListener("submit", guardarProducto);
}

const cerrarModalProducto = document.getElementById("cerrar-modal-producto");

if (cerrarModalProducto) {
  cerrarModalProducto.addEventListener("click", () => {
    document.getElementById("modal-producto").classList.add("hidden");
  });
}

const modalProductoOverlay = document.getElementById("modal-producto-overlay");

if (modalProductoOverlay) {
  modalProductoOverlay.addEventListener("click", () => {
    document.getElementById("modal-producto").classList.add("hidden");
  });
}
