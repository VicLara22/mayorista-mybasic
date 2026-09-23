let productosData = [];

const productosDiv = document.getElementById("productos");
const pedido = [];
let productoSeleccionado = null;

const STOCK_API_URL = "https://mayorista-mybasic.onrender.com/api/stock/publico";
let stockData = [];

const money = (value) => new Intl.NumberFormat("es-AR").format(value);

async function cargarStock() {
  try {
    const respuesta = await fetch(STOCK_API_URL);

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el stock.");
    }

    stockData = await respuesta.json();
  } catch (error) {
    console.error("Error al cargar stock:", error);
    stockData = [];
  }
}

function obtenerStockDisponible(productoId, talle, color) {
  const stock = stockData.find(
    (item) =>
      Number(item.producto_id) === Number(productoId) &&
      item.talle === talle &&
      item.color === color,
  );

  if (!stock) {
    return 0;
  }

  const cantidadEnPedido = pedido
    .filter(
      (item) =>
        Number(item.productoId) === Number(productoId) &&
        item.talle === talle &&
        item.color === color,
    )
    .reduce((total, item) => total + Number(item.cantidad), 0);

  return Math.max(Number(stock.cantidad) - cantidadEnPedido, 0);
}

async function cargarProductos() {
  try {
    const respuesta = await fetch("https://mayorista-mybasic.onrender.com/api/productos");

    if (!respuesta.ok) {
      throw new Error("No se pudieron obtener los productos.");
    }

    const productosDB = await respuesta.json();

    productosData = productosDB.map((producto) => ({
      ...producto,
      precio: Number(producto.precio),
    }));

    generarCards(productosData);
  } catch (error) {
    console.error("Error al cargar productos:", error);

    productosDiv.innerHTML = `
      <div class="col-span-full rounded-2xl bg-red-50 p-10 text-center text-red-600">
        No pudimos cargar los productos. Verificá que el servidor esté funcionando.
      </div>
    `;
  }
}

function generarCards(array) {
  productosDiv.innerHTML = "";

  if (!array.length) {
    productosDiv.innerHTML = `
          <div class="col-span-full rounded-2xl bg-gray-50 p-10 text-center text-gray-500">
            No encontramos productos en esta categoría.
          </div>
        `;
    return;
  }

  array.forEach((prod, index) => {
    const card = document.createElement("article");
    card.className =
      "product-card overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm";
    card.innerHTML = `
          <div class="relative bg-gray-100">
            <img src="${prod.img}" alt="${prod.nombre}" class="h-72 w-full object-contain p-4" loading="lazy">
            <span class="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">
              ${prod.categoria}
            </span>
          </div>

          <div class="p-5">
            <h3 class="text-lg font-black">${prod.nombre}</h3>

            <p class="mt-2 text-sm leading-6 text-gray-600">${prod.descripcion}</p>

            <div class="mt-4 flex items-end justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-gray-400">Valor</p>
                <p class="text-2xl font-black">$${money(prod.precio)}</p>
                <p class="text-xs text-gray-500">cada una</p>
              </div>

              <p class="text-right text-xs text-gray-500">
                ${prod.colores.length} colores<br>
                ${prod.talles.join(" · ")}
              </p>
            </div>

            <button data-index="${index}"
              class="abrir-producto mt-5 w-full rounded-full bg-gray-950 px-5 py-3 font-bold text-white transition hover:bg-gray-800">
              Elegir producto
            </button>
          </div>
        `;

    productosDiv.appendChild(card);
  });

  document.querySelectorAll(".abrir-producto").forEach((button) => {
    button.addEventListener("click", () =>
      abrirProducto(array[Number(button.dataset.index)]),
    );
  });
}

async function abrirProducto(prod) {
  productoSeleccionado = prod;

  // Actualizar stock antes de mostrar la disponibilidad.
  await cargarStock();

  document.getElementById("modal-titulo").textContent = prod.nombre;
  document.getElementById("modal-img").src = prod.img;
  document.getElementById("modal-img").alt = prod.nombre;
  document.getElementById("modal-descripcion").textContent =
    `${prod.descripcion} Uso: ${prod.uso}. ${prod.lavado}`;
  document.getElementById("modal-precio").textContent =
    `$${money(prod.precio)} por unidad`;

  const talle = document.getElementById("modal-talle");
  const color = document.getElementById("modal-color");

  talle.innerHTML =
    `<option value="">Elegí talle</option>` +
    prod.talles.map((t) => `<option value="${t}">${t}</option>`).join("");

  color.innerHTML =
    `<option value="">Elegí color</option>` +
    prod.colores.map((c) => `<option value="${c}">${c}</option>`).join("");

  document.getElementById("modal-cantidad").value = 1;
  document.getElementById("producto-modal").classList.remove("hidden");

  actualizarDisponibilidad();

  document.getElementById("producto-modal").classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

function actualizarDisponibilidad() {
  if (!productoSeleccionado) {
    return;
  }

  const talle = document.getElementById("modal-talle").value;
  const color = document.getElementById("modal-color").value;
  const cantidadInput = document.getElementById("modal-cantidad");
  const botonAgregar = document.getElementById("modal-agregar");

  let indicadorStock = document.getElementById("modal-stock");

  if (!indicadorStock) {
    indicadorStock = document.createElement("p");
    indicadorStock.id = "modal-stock";
    indicadorStock.className = "mt-3 text-sm font-bold";

    botonAgregar.parentElement.insertBefore(indicadorStock, botonAgregar);
  }

  if (!talle || !color) {
    indicadorStock.textContent = "Elegí talle y color para consultar el stock.";

    indicadorStock.className = "mt-3 text-sm text-gray-500";

    botonAgregar.classList.remove("hidden");
    botonAgregar.disabled = true;

    return;
  }

  const stockDisponible = obtenerStockDisponible(
    productoSeleccionado.id,
    talle,
    color,
  );

  const cantidad = Number(cantidadInput.value);

  cantidadInput.min = 1;
  cantidadInput.max = stockDisponible;

  if (stockDisponible <= 0) {
    indicadorStock.textContent = "Sin stock para esta combinación.";
    indicadorStock.className = "mt-3 text-sm font-bold text-red-600";

    botonAgregar.classList.add("hidden");
    botonAgregar.disabled = true;

    return;
  }

  indicadorStock.textContent = `Stock disponible: ${stockDisponible} unidades`;

  indicadorStock.className = "mt-3 text-sm font-bold text-green-700";

  botonAgregar.classList.remove("hidden");

  if (cantidad > stockDisponible) {
    indicadorStock.textContent = `Solo quedan ${stockDisponible} unidades disponibles.`;

    indicadorStock.className = "mt-3 text-sm font-bold text-red-600";

    botonAgregar.disabled = true;

    return;
  }

  botonAgregar.disabled = cantidad < 1;
}

function cerrarModal() {
  document.getElementById("producto-modal").classList.add("hidden");
  document.getElementById("producto-modal").classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

function actualizarPedido() {
  const lista = document.getElementById("lista-pedido");
  const vacio = document.getElementById("pedido-vacio");

  lista.innerHTML = "";

  const totalUnidades = pedido.reduce(
    (total, item) => total + item.cantidad,
    0,
  );
  const totalPrecio = pedido.reduce(
    (total, item) => total + item.cantidad * item.precio,
    0,
  );

  document.getElementById("total-unidades").textContent = totalUnidades;
  document.getElementById("total-precio").textContent =
    `$${money(totalPrecio)}`;
  document.getElementById("contador-header").textContent = `(${totalUnidades})`;
  document.getElementById("contador-catalogo").textContent =
    `(${totalUnidades})`;

  vacio.classList.toggle("hidden", pedido.length > 0);

  pedido.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "rounded-2xl border border-gray-200 p-4";
    div.innerHTML = `
          <div class="flex justify-between gap-4">
            <div>
              <p class="font-bold">${item.nombre}</p>
              <p class="mt-1 text-sm text-gray-500">
                ${item.talle} · ${item.color} · ${item.cantidad} un.
              </p>
              <p class="mt-2 font-bold">$${money(item.cantidad * item.precio)}</p>
            </div>
            <button data-index="${index}" class="eliminar-item self-start text-xl font-bold text-gray-400 hover:text-red-600" aria-label="Eliminar">
              &times;
            </button>
          </div>
        `;
    lista.appendChild(div);
  });
}

function agregarProducto() {
  if (!productoSeleccionado) {
    return;
  }

  const cantidad = Number(document.getElementById("modal-cantidad").value);

  const talle = document.getElementById("modal-talle").value;
  const color = document.getElementById("modal-color").value;

  if (!cantidad || cantidad < 1 || !talle || !color) {
    mostrarAlerta("Elegí cantidad, talle y color para agregar el producto.");
    return;
  }

  const stockDisponible = obtenerStockDisponible(
    productoSeleccionado.id,
    talle,
    color,
  );

  if (stockDisponible <= 0) {
    mostrarAlerta("No hay stock disponible para esta combinación.");
    actualizarDisponibilidad();
    return;
  }

  if (cantidad > stockDisponible) {
    mostrarAlerta(
      `Solo hay ${stockDisponible} unidades disponibles para el talle ${talle} y color ${color}.`,
    );

    actualizarDisponibilidad();
    return;
  }

  pedido.push({
    productoId: productoSeleccionado.id,
    nombre: productoSeleccionado.nombre,
    cantidad,
    talle,
    color,
    precio: productoSeleccionado.precio,
  });

  actualizarPedido();
  cerrarModal();
  abrirPedido();
}

let checkoutPasoActual = 1;

function mostrarPasoCheckout(paso) {
  checkoutPasoActual = paso;

  document
    .getElementById("checkout-paso-1")
    .classList.toggle("hidden", paso !== 1);

  document
    .getElementById("checkout-paso-2")
    .classList.toggle("hidden", paso !== 2);

  document
    .getElementById("checkout-paso-3")
    .classList.toggle("hidden", paso !== 3);

  document.getElementById("checkout-confirmacion").classList.add("hidden");

  document
    .getElementById("botones-paso-1")
    .classList.toggle("hidden", paso !== 1);

  document
    .getElementById("botones-paso-2")
    .classList.toggle("hidden", paso !== 2);

  document
    .getElementById("botones-paso-3")
    .classList.toggle("hidden", paso !== 3);

  const indicadores = [
    document.getElementById("paso-indicador-1"),
    document.getElementById("paso-indicador-2"),
    document.getElementById("paso-indicador-3"),
  ];

  indicadores.forEach((indicador, index) => {
    const activo = index + 1 === paso;

    indicador.classList.toggle("text-gray-950", activo);
    indicador.classList.toggle("text-gray-400", !activo);
  });

  if (paso === 3) {
    actualizarTotalCheckout();
  }
}

function actualizarTotalCheckout() {
  const totalPrecio = pedido.reduce(
    (total, item) => total + item.cantidad * item.precio,
    0,
  );

  const entrega = document.querySelector('input[name="tipo-entrega"]:checked');

  const checkoutTotalFinal = document.getElementById("checkout-total-final");
  const checkoutMontoLabel = document.getElementById("checkout-monto-label");
  const checkoutMontoAclaracion = document.getElementById(
    "checkout-monto-aclaracion",
  );

  const resumenPagoRetiro = document.getElementById("resumen-pago-retiro");
  const montoSena = document.getElementById("monto-sena");
  const montoSaldoEfectivo = document.getElementById("monto-saldo-efectivo");

  if (!checkoutTotalFinal) {
    return;
  }

  if (entrega && entrega.value === "retiro") {
    const sena = totalPrecio * 0.25;
    const saldoEfectivo = totalPrecio * 0.75;

    checkoutTotalFinal.textContent = `$${money(sena)}`;

    if (checkoutMontoLabel) {
      checkoutMontoLabel.textContent = "Seña a transferir (25%)";
    }

    if (checkoutMontoAclaracion) {
      checkoutMontoAclaracion.textContent =
        "Transferís el 25% del total. El 75% restante se abona únicamente en efectivo al retirar.";
    }

    if (resumenPagoRetiro && montoSena && montoSaldoEfectivo) {
      montoSena.textContent = `$${money(sena)}`;
      montoSaldoEfectivo.textContent = `$${money(saldoEfectivo)}`;

      resumenPagoRetiro.classList.remove("hidden");
    }
  } else {
    checkoutTotalFinal.textContent = `$${money(totalPrecio)}`;

    if (checkoutMontoLabel) {
      checkoutMontoLabel.textContent = "Total a transferir";
    }

    if (checkoutMontoAclaracion) {
      checkoutMontoAclaracion.textContent =
        "Transferís el 100% del total del pedido. El envío se abona aparte al retirar en Vía Cargo.";
    }

    if (resumenPagoRetiro) {
      resumenPagoRetiro.classList.add("hidden");
    }
  }
}

function abrirPedido() {
  actualizarPedido();
  mostrarPasoCheckout(1);

  document.getElementById("pedido-panel").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function cerrarPedido() {
  document.getElementById("pedido-panel").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function validarPaso1() {
  if (pedido.length === 0) {
    mostrarAlerta("Primero agregá al menos un producto a tu pedido.");
    return false;
  }

  const entrega = document.querySelector('input[name="tipo-entrega"]:checked');

  if (!entrega) {
    mostrarAlerta("Elegí cómo querés recibir tu pedido.");
    return false;
  }

  if (entrega.value === "via_cargo") {
    const codigoPostal = document.getElementById("codigo-postal").value.trim();

    if (!codigoPostal) {
      mostrarAlerta("Ingresá tu código postal.");
      return false;
    }
  }

  return true;
}

function validarPaso2() {
  const nombre = document.getElementById("cliente-nombre").value.trim();
  const apellido = document.getElementById("cliente-apellido").value.trim();
  const dni = document.getElementById("cliente-dni").value.trim();
  const telefono = document.getElementById("cliente-telefono").value.trim();
  const calle = document.getElementById("cliente-calle").value.trim();
  const numero = document.getElementById("cliente-numero").value.trim();
  const barrio = document.getElementById("cliente-barrio").value.trim();
  const localidad = document.getElementById("cliente-localidad").value.trim();

  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
  const soloNumeros = /^\d+$/;

  if (!nombre) {
    mostrarAlerta("Completá el campo nombre.");
    document.getElementById("cliente-nombre").focus();
    return false;
  }

  if (nombre.length < 2) {
    mostrarAlerta("El nombre debe tener al menos 2 caracteres.");
    document.getElementById("cliente-nombre").focus();
    return false;
  }

  if (!soloLetras.test(nombre)) {
    mostrarAlerta("El nombre solo puede contener letras.");
    document.getElementById("cliente-nombre").focus();
    return false;
  }

  if (!apellido) {
    mostrarAlerta("Completá el campo apellido.");
    document.getElementById("cliente-apellido").focus();
    return false;
  }

  if (apellido.length < 2) {
    mostrarAlerta("El apellido debe tener al menos 2 caracteres.");
    document.getElementById("cliente-apellido").focus();
    return false;
  }

  if (!soloLetras.test(apellido)) {
    mostrarAlerta("El apellido solo puede contener letras.");
    document.getElementById("cliente-apellido").focus();
    return false;
  }

  if (!dni) {
    mostrarAlerta("Completá el campo DNI.");
    document.getElementById("cliente-dni").focus();
    return false;
  }

  if (!soloNumeros.test(dni) || dni.length < 7 || dni.length > 8) {
    mostrarAlerta("El DNI debe tener entre 7 y 8 números.");
    document.getElementById("cliente-dni").focus();
    return false;
  }

  if (!telefono) {
    mostrarAlerta("Completá el campo teléfono.");
    document.getElementById("cliente-telefono").focus();
    return false;
  }

  const telefonoNumeros = telefono.replace(/\D/g, "");

  if (telefonoNumeros.length < 8 || telefonoNumeros.length > 15) {
    mostrarAlerta("Ingresá un número de teléfono válido.");
    document.getElementById("cliente-telefono").focus();
    return false;
  }

  if (!calle) {
    mostrarAlerta("Completá el campo calle.");
    document.getElementById("cliente-calle").focus();
    return false;
  }

  if (calle.length < 2) {
    mostrarAlerta("La calle debe tener al menos 2 caracteres.");
    document.getElementById("cliente-calle").focus();
    return false;
  }

  if (!numero) {
    mostrarAlerta("Completá el número de calle.");
    document.getElementById("cliente-numero").focus();
    return false;
  }

  if (!soloNumeros.test(numero)) {
    mostrarAlerta("El número de calle solo puede contener números.");
    document.getElementById("cliente-numero").focus();
    return false;
  }

  if (!barrio) {
    mostrarAlerta("Completá el campo barrio.");
    document.getElementById("cliente-barrio").focus();
    return false;
  }

  if (barrio.length < 2) {
    mostrarAlerta("El barrio debe tener al menos 2 caracteres.");
    document.getElementById("cliente-barrio").focus();
    return false;
  }

  if (!localidad) {
    mostrarAlerta("Completá el campo localidad.");
    document.getElementById("cliente-localidad").focus();
    return false;
  }

  if (localidad.length < 2) {
    mostrarAlerta("La localidad debe tener al menos 2 caracteres.");
    document.getElementById("cliente-localidad").focus();
    return false;
  }

  return true;
}

async function realizarPedido() {
  if (pedido.length === 0) {
    mostrarAlerta("Primero agregá al menos un producto a tu pedido.");
    return;
  }

  const entrega = document.querySelector('input[name="tipo-entrega"]:checked');

  if (!entrega) {
    mostrarAlerta("Elegí un método de entrega.");
    mostrarPasoCheckout(1);
    return;
  }

  const medioPago = document.querySelector('input[name="medio-pago"]:checked');

  const total = pedido.reduce(
    (total, item) => total + item.cantidad * item.precio,
    0,
  );

  const esRetiro = entrega.value === "retiro";

  const montoTransferencia = esRetiro ? total * 0.25 : total;

  const saldoEfectivo = esRetiro ? total * 0.75 : 0;

  const items = pedido.map((item) => ({
    producto_id: item.productoId,
    talle: item.talle,
    color: item.color,
    cantidad: item.cantidad,
  }));

  const datosPedido = {
    nombre: document.getElementById("cliente-nombre").value.trim(),
    apellido: document.getElementById("cliente-apellido").value.trim(),
    dni: document.getElementById("cliente-dni").value.trim(),
    telefono: document.getElementById("cliente-telefono").value.trim(),

    tipo_entrega: entrega.value,

    codigo_postal:
      entrega.value === "via_cargo"
        ? document.getElementById("codigo-postal").value.trim()
        : null,

    calle: document.getElementById("cliente-calle").value.trim(),
    numero: document.getElementById("cliente-numero").value.trim(),

    departamento:
      document.getElementById("cliente-departamento").value.trim() || null,

    barrio: document.getElementById("cliente-barrio").value.trim(),

    localidad: document.getElementById("cliente-localidad").value.trim(),

    medio_pago: esRetiro
      ? "sena_transferencia_saldo_efectivo"
      : "transferencia",

    total,

    monto_transferencia: montoTransferencia,

    saldo_efectivo: saldoEfectivo,

    items,
  };

  const boton = document.getElementById("realizar-pedido");

  boton.disabled = true;
  boton.textContent = "Enviando pedido...";

  try {
    const respuesta = await fetch("https://mayorista-mybasic.onrender.com/api/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosPedido),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo crear el pedido.");
    }

    document.getElementById("numero-pedido-confirmacion").textContent =
      `#${resultado.pedidoId}`;

    // ACTUALIZAR INFORMACIÓN DE PAGO EN LA CONFIRMACIÓN
    const confirmacionMontoLabel = document.getElementById(
      "confirmacion-monto-label",
    );

    const confirmacionMontoTransferencia = document.getElementById(
      "confirmacion-monto-transferencia",
    );

    const confirmacionMensajePago = document.getElementById(
      "confirmacion-mensaje-pago",
    );

    if (esRetiro) {
      confirmacionMontoLabel.textContent = "Seña a transferir (25%)";

      confirmacionMontoTransferencia.textContent = `$${money(datosPedido.monto_transferencia)}`;

      confirmacionMensajePago.textContent = `Transferís el 25% del total. El saldo de $${money(datosPedido.saldo_efectivo)} se abona únicamente en efectivo al retirar.`;
    } else {
      confirmacionMontoLabel.textContent = "Total a transferir";

      confirmacionMontoTransferencia.textContent = `$${money(datosPedido.monto_transferencia)}`;

      confirmacionMensajePago.textContent =
        "Transferís el 100% del total del pedido. El envío se abona aparte al retirar en Vía Cargo.";
    }

    const botonWhatsApp = document.getElementById(
      "enviar-comprobante-whatsapp",
    );

    const mensajeWhatsApp = esRetiro
      ? [
          "Hola, realicé una transferencia correspondiente a mi pedido de MyBasic.",
          `Pedido: #${resultado.pedidoId}`,
          `Nombre: ${datosPedido.nombre} ${datosPedido.apellido}`,
          `Total del pedido: $${money(datosPedido.total)}`,
          `Seña transferida (25%): $${money(datosPedido.monto_transferencia)}`,
          `Saldo a abonar en efectivo: $${money(datosPedido.saldo_efectivo)}`,
          "",
          "Adjunto el comprobante de la transferencia.",
        ].join("\n")
      : [
          "Hola, realicé una transferencia correspondiente a mi pedido de MyBasic.",
          `Pedido: #${resultado.pedidoId}`,
          `Nombre: ${datosPedido.nombre} ${datosPedido.apellido}`,
          `Total transferido: $${money(datosPedido.monto_transferencia)}`,
          "",
          "Adjunto el comprobante de la transferencia.",
        ].join("\n");

    botonWhatsApp.href = `https://wa.me/5491173591058?text=${encodeURIComponent(mensajeWhatsApp)}`;

    document.getElementById("checkout-paso-1").classList.add("hidden");
    document.getElementById("checkout-paso-2").classList.add("hidden");
    document.getElementById("checkout-paso-3").classList.add("hidden");

    document.getElementById("botones-paso-1").classList.add("hidden");
    document.getElementById("botones-paso-2").classList.add("hidden");
    document.getElementById("botones-paso-3").classList.add("hidden");

    document.getElementById("checkout-confirmacion").classList.remove("hidden");

    pedido.length = 0;

    actualizarPedido();
    await cargarStock();
  } catch (error) {
    console.error("Error al crear el pedido:", error);

    mostrarAlerta(
      "No pudimos registrar tu pedido. Verificá que el servidor esté funcionando e intentá nuevamente.",
    );
  } finally {
    boton.disabled = false;
    boton.textContent = "Realizar pedido";
  }
}
// Filtros
document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("bg-gray-950", "text-white");
      btn.classList.add("border", "border-gray-300");
    });

    button.classList.add("bg-gray-950", "text-white");
    button.classList.remove("border", "border-gray-300");

    const filtro = button.dataset.filter;
    const filtrados =
      filtro === "Todos"
        ? productosData
        : productosData.filter((prod) => prod.categoria === filtro);

    generarCards(filtrados);
  });
});

// FAQ
document.querySelectorAll(".faq-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const answer = button.nextElementSibling;
    const icon = button.querySelector(".faq-icon");
    const estaOculto = answer.classList.contains("hidden");

    answer.classList.toggle("hidden");
    icon.textContent = estaOculto ? "−" : "+";
  });
});

// Eventos
document.getElementById("cerrar-modal").addEventListener("click", cerrarModal);
document.getElementById("producto-modal").addEventListener("click", (e) => {
  if (e.target.id === "producto-modal") cerrarModal();
});

document
  .getElementById("modal-talle")
  .addEventListener("change", actualizarDisponibilidad);

document
  .getElementById("modal-color")
  .addEventListener("change", actualizarDisponibilidad);

document
  .getElementById("modal-cantidad")
  .addEventListener("input", actualizarDisponibilidad);

document
  .getElementById("modal-agregar")
  .addEventListener("click", agregarProducto);

document
  .getElementById("abrir-pedido-header")
  .addEventListener("click", abrirPedido);
document
  .getElementById("abrir-pedido-catalogo")
  .addEventListener("click", abrirPedido);

document
  .getElementById("cerrar-pedido")
  .addEventListener("click", cerrarPedido);
document
  .getElementById("pedido-overlay")
  .addEventListener("click", cerrarPedido);

document
  .getElementById("checkout-continuar-1")
  .addEventListener("click", () => {
    if (validarPaso1()) {
      mostrarPasoCheckout(2);
    }
  });

document.getElementById("checkout-volver-2").addEventListener("click", () => {
  mostrarPasoCheckout(1);
});

document
  .getElementById("checkout-continuar-2")
  .addEventListener("click", () => {
    if (validarPaso2()) {
      mostrarPasoCheckout(3);
    }
  });

document.getElementById("checkout-volver-3").addEventListener("click", () => {
  mostrarPasoCheckout(2);
});

document
  .getElementById("realizar-pedido")
  .addEventListener("click", realizarPedido);
document.getElementById("cerrar-confirmacion").addEventListener("click", () => {
  cerrarPedido();

  document.getElementById("checkout-confirmacion").classList.add("hidden");

  mostrarPasoCheckout(1);
});

document.querySelectorAll('input[name="tipo-entrega"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const container = document.getElementById("codigo-postal-container");

    container.classList.toggle(
      "hidden",
      radio.value !== "via_cargo" || !radio.checked,
    );

    actualizarTotalCheckout();
  });
});

document.getElementById("cancelar-pedido").addEventListener("click", () => {
  if (!pedido.length) return;

  mostrarConfirmacion("Se eliminarán todos los productos de tu pedido.", () => {
    pedido.length = 0;
    actualizarPedido();
  });
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("eliminar-item")) {
    const index = Number(e.target.dataset.index);
    pedido.splice(index, 1);
    actualizarPedido();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
    cerrarPedido();
  }
});

cargarStock().then(() => {
  cargarProductos();
});

actualizarPedido();
