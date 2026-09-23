const AUTH_URL = "http://127.0.0.1:3001/api/auth";

function obtenerToken() {
  return sessionStorage.getItem("adminToken");
}

function guardarToken(token) {
  sessionStorage.setItem("adminToken", token);
}

function cerrarSesion() {
  sessionStorage.removeItem("adminToken");
  mostrarLogin();
}

function mostrarLogin() {
  document.getElementById("login-container").classList.remove("hidden");

  document.getElementById("admin-container").classList.add("hidden");
}

function mostrarAdmin() {
  document.getElementById("login-container").classList.add("hidden");

  document.getElementById("admin-container").classList.remove("hidden");
}

async function iniciarSesion(event) {
  event.preventDefault();

  const usuario = document.getElementById("login-usuario").value.trim();

  const contraseña = document.getElementById("login-contraseña").value;

  const mensaje = document.getElementById("login-mensaje");

  const boton = document.getElementById("login-boton");

  mensaje.classList.add("hidden");

  boton.disabled = true;
  boton.textContent = "Ingresando...";

  try {
    const respuesta = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario,
        contraseña,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo iniciar sesión.");
    }

    guardarToken(resultado.token);
    document.getElementById("login-contraseña").value = "";

    mostrarAdmin();

    cargarPedidos();
    cargarProductosAdmin();
    cargarStock();
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    mensaje.textContent = error.message || "Usuario o contraseña incorrectos.";

    mensaje.className = "mt-4 text-center text-sm font-semibold text-red-600";

    mensaje.classList.remove("hidden");
  } finally {
    boton.disabled = false;
    boton.textContent = "Iniciar sesión";
  }
}

const formularioLogin = document.getElementById("login-form");

if (formularioLogin) {
  formularioLogin.addEventListener("submit", iniciarSesion);
}

if (obtenerToken()) {
  mostrarAdmin();
} else {
  mostrarLogin();
}

const botonCerrarSesion = document.getElementById("cerrar-sesion");

if (botonCerrarSesion) {
  botonCerrarSesion.addEventListener("click", cerrarSesion);
}
