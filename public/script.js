let paises = [];

function iniciarSesion(evento) {
    evento.preventDefault();
    const usuario = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (usuario === "alumno" && password === "1234") {
        sessionStorage.setItem("sesion", "activa");
        window.location.href = "inicio.html";
    } else {
        document.getElementById("error-login").textContent = "Usuario o contraseña incorrectos.";
    }
}

function cerrarSesion() {
    sessionStorage.removeItem("sesion");
    window.location.href = "index.html";
}

function mostrarModalidad() {
    const modalidad = document.querySelector('input[name="modalidad"]:checked').value;
    const contenido = document.getElementById("contenido-modalidad");
    contenido.hidden = false;

    if (modalidad === "presencial") {
        contenido.textContent = "Seleccionaste asistir de manera presencial.";
    } else {
        contenido.textContent = "Seleccionaste participar de manera virtual.";
    }
}

async function cargarPaises() {
    try {
        const respuesta = await fetch("country-region-data.json");
        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los países.");
        }
        paises = await respuesta.json();
        const selector = document.getElementById("pais");

        for (let i = 0; i < paises.length; i++) {
            const opcion = document.createElement("option");
            opcion.value = i;
            opcion.textContent = paises[i].countryName;
            selector.appendChild(opcion);
        }
        selector.disabled = false;
    } catch (error) {
        document.getElementById("error-paises").textContent = "No se pudieron cargar los países. Abre el sitio con Live Server e inténtalo de nuevo.";
    }
}

function cargarRegiones() {
    const pais = document.getElementById("pais").value;
    const selector = document.getElementById("region");
    selector.innerHTML = '<option value="">Selecciona una región</option>';
    selector.disabled = true;

    if (pais !== "") {
        const regiones = paises[pais].regions;
        for (let i = 0; i < regiones.length; i++) {
            const opcion = document.createElement("option");
            opcion.value = regiones[i].name;
            opcion.textContent = regiones[i].name;
            selector.appendChild(opcion);
        }
        selector.disabled = false;
    }
}

function activarBoton() {
    const terminos = document.getElementById("terminos").checked;
    const datos = document.getElementById("datos").checked;
    document.getElementById("enviar").disabled = !(terminos && datos);
}

function enviarFormulario(evento) {
    evento.preventDefault();
    document.getElementById("resultado").textContent = "Formulario completado correctamente.";
}

if (window.location.pathname.endsWith("inicio.html") && sessionStorage.getItem("sesion") !== "activa") {
    window.location.href = "index.html";
}

if (document.getElementById("pais")) {
    cargarPaises();
}
