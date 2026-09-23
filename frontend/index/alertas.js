const modal = document.getElementById("modal-alerta");
const titulo = document.getElementById("alerta-titulo");
const mensajeElemento = document.getElementById("alerta-mensaje");
const botonCerrar = document.getElementById("alerta-cerrar");
const botonConfirmar = document.getElementById("alerta-confirmar");

function mostrarAlerta(mensaje, tituloTexto = "Aviso") {
  titulo.textContent = tituloTexto;
  mensajeElemento.textContent = mensaje;

  botonCerrar.classList.add("hidden");

  botonConfirmar.textContent = "Entendido";
  botonConfirmar.onclick = cerrarAlerta;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function mostrarConfirmacion(mensaje, accionConfirmar) {
  titulo.textContent = "Vaciar pedido";
  mensajeElemento.textContent = mensaje;

  botonCerrar.classList.remove("hidden");
  botonCerrar.textContent = "Cancelar";

  botonConfirmar.textContent = "Confirmar";

  botonCerrar.onclick = cerrarAlerta;

  botonConfirmar.onclick = () => {
    cerrarAlerta();
    accionConfirmar();
  };

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function cerrarAlerta() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}
