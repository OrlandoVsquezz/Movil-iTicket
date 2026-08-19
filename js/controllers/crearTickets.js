// Cantidad máxima de evidencias permitidas en un ticket
const LIMITE_FOTOS = 5;

// Valores válidos del tipo del ticket
const TIPOS_PERMITIDOS = ["Articulo", "General", "Software"];

// Referencias a elementos del DOM para leer campos y actualizar la interfaz.
const formularioTicket = document.getElementById("formCrearTicket");
const tipoTicketInput = document.getElementById("tipoTicket");
const descripcionTipoTicket = document.getElementById("descripcionTipoTicket");
const camposTipoTicket = document.getElementById("camposTipoTicket");
const inputCamara = document.getElementById("inputCamara");
const inputGaleria = document.getElementById("inputGaleria");
const abrirGaleria = document.getElementById("abrirGaleria");
const botonTomarFoto = document.getElementById("botonTomarFoto");
const visorFotografia = document.getElementById("visorFotografia");
const destelloCamara = document.getElementById("destelloCamara");
const vistaCamara = document.getElementById("vistaCamara");
const lienzoCaptura = document.getElementById("lienzoCaptura");
const estadoSinFoto = document.getElementById("estadoSinFoto");
const mensajeCamara = document.getElementById("mensajeCamara");
const pilaMiniaturas = document.getElementById("pilaMiniaturas");
const cantidadApilada = document.getElementById("cantidadApilada");
const contadorFotos = document.getElementById("contadorFotos");
const abrirVisorGaleria = document.getElementById("abrirVisorGaleria");
const visorGaleria = document.getElementById("visorGaleria");
const cerrarVisor = document.getElementById("cerrarVisor");
const eliminarFoto = document.getElementById("eliminarFoto");
const fotoModal = document.getElementById("fotoModal");
const posicionFoto = document.getElementById("posicionFoto");
const fotoAnterior = document.getElementById("fotoAnterior");
const fotoSiguiente = document.getElementById("fotoSiguiente");
const tiraModal = document.getElementById("tiraModal");
const agregarDesdeVisor = document.getElementById("agregarDesdeVisor");

let fotografias = [];              // Objetos { archivo, url } de cada evidencia.
let fotografiaSeleccionada = 0;    // Índice de la foto abierta en el visor.
let transmisionCamara = null;       // MediaStream entregado por getUserMedia.
let inicioDeslizamiento = 0;        // Coordenada inicial para detectar un swipe.

// Lee ?tipo= de la URL. Ejemplo: crearTickets.html?tipo=Software.
function obtenerTipoTicket() {
    // URLSearchParams convierte la parte de parámetros de la dirección en datos que se pueden consultar
    const parametros = new URLSearchParams(window.location.search);
    const tipoSolicitado = parametros.get("tipo"); // Se consulta el tipo

    // .includes ve si el valor no es permitido, se utiliza General como opción predeterminada
    return TIPOS_PERMITIDOS.includes(tipoSolicitado) ? tipoSolicitado : "General";
}

// Devuelve las opciones del select después se reemplazarán con la API
function opcionesDepartamentos() {
    return `
        <option value="">Selecciona</option>
        <option value="1">IT-CFP</option>
        <option value="2">Administración</option>
        <option value="3">Mantenimiento</option>
    `;
}

// Crea un campo de departamento para los tres tipos de ticket
function campoDepartamento() {
    return `
        <div class="campo-ticket">
            <label for="sltDepartamento">Departamento:</label>
            <select id="sltDepartamento" name="idDepartamento" required>
                ${opcionesDepartamentos()}
            </select>
        </div>
    `;
}

// Construye los campos dependiendo del tipo recibido por la URL
function renderizarCamposTipo(tipo) {
    // El input hidden pone el tipoTicket que se obtuvo
    tipoTicketInput.value = tipo;

    // Aqui dependiendo del tipo se van a crear los inputs y asi
    if (tipo === "Articulo") {
        descripcionTipoTicket.textContent = "Reporta uno o varios equipos o mobiliarios inventariados.";
        camposTipoTicket.innerHTML = `
            <div class="campos-dinamicos">
                <div class="campo-ticket">
                    <label for="codigoArticulo1">Código del equipo/mobiliario:</label>
                    <div class="lista-codigos" id="listaCodigos">
                        <div class="control-codigo">
                            <input type="text" id="codigoArticulo1" name="codigosArticulo[]" placeholder="#456AS31" required>
                            <button type="button" class="boton-agregar-codigo" id="agregarCodigo" aria-label="Agregar otro artículo">+</button>
                        </div>
                    </div>
                </div>
                ${campoDepartamento()}
            </div>
        `;
        prepararCodigosAdicionales();
        return;
    }

    if (tipo === "Software") {
        descripcionTipoTicket.textContent = "Indica el programa, su versión y dónde se encuentra el equipo.";
        camposTipoTicket.innerHTML = `
            <div class="campos-dinamicos">
                <div class="campo-ticket">
                    <label for="txtNombreSoftware">Software:</label>
                    <input type="text" id="txtNombreSoftware" name="nombreSoftware" placeholder="Nombre del programa" required>
                </div>
                <div class="campo-ticket">
                    <label for="txtVersion">Versión:</label>
                    <input type="text" id="txtVersion" name="version" placeholder="Ej. 2026.1" required>
                </div>
                <div class="campo-ticket">
                    <label for="sltUbicacionSoftware">Ubicación:</label>
                    <select id="sltUbicacionSoftware" name="idUbicacion" required>
                        <option value="">Selecciona</option>
                        <option value="1">Laboratorio</option>
                        <option value="2">Oficina</option>
                        <option value="3">Aula</option>
                    </select>
                </div>
                ${campoDepartamento()}
            </div>
        `;
        return;
    }

    descripcionTipoTicket.textContent = "Describe la ubicación del problema de electricidad, red u otro servicio.";
    camposTipoTicket.innerHTML = `
        <div class="campos-dinamicos">
            <div class="campo-ticket campo-ancho-completo">
                <label for="txtDescripcionUbicacion">Ubicación del problema:</label>
                <input type="text" id="txtDescripcionUbicacion" name="descripcionUbicacion"
                    placeholder="Ej. Segundo nivel, aula B-12" required>
            </div>
            ${campoDepartamento()}
        </div>
    `;
}

// Permite añadir varios códigos de artículos y quitar campos agregados por error.
function prepararCodigosAdicionales() {
    const listaCodigos = document.getElementById("listaCodigos");
    const agregarCodigo = document.getElementById("agregarCodigo");

    agregarCodigo.addEventListener("click", function () {
        // La cantidad actual se usa para numerar el placeholder del nuevo campo.
        const cantidad = listaCodigos.querySelectorAll("input").length;
        const fila = document.createElement("div");
        fila.className = "codigo-adicional";
        fila.innerHTML = `
            <input type="text" name="codigosArticulo[]" placeholder="Código del artículo ${cantidad + 1}" required>
            <button type="button" class="boton-quitar-codigo" aria-label="Quitar código">×</button>
        `;
        // El botón × elimina solamente esta fila de código, no elimina el ticket.
        fila.querySelector(".boton-quitar-codigo").addEventListener("click", function () {
            fila.remove();
        });
        listaCodigos.appendChild(fila);
        fila.querySelector("input").focus();
    });
}

// Solicita el permiso para ocupar cámara trasera y conecta su transmisión con <video>
async function iniciarCamara() {
    // Esta condición comprueba si si se puede ocupar con la cámara en vivo
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        mensajeCamara.textContent = "Toca el botón para abrir la cámara";
        return;
    }

    try {
        // facingMode environment solicita preferentemente la cámara trasera para poder usar la camara
        transmisionCamara = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 1280 }
            },
            // Nada de audio
            audio: false
        });

        vistaCamara.controls = false;
        vistaCamara.disablePictureInPicture = true;
        vistaCamara.srcObject = transmisionCamara;

        // Espera antes de mostrar el video para evitar controles nativos
        if (vistaCamara.readyState < 1) {
            await new Promise(function (resolve) {
                vistaCamara.addEventListener("loadedmetadata", resolve, { once: true });
            });
        }

        await vistaCamara.play();
        vistaCamara.hidden = false;
        estadoSinFoto.hidden = true;
        reproducirAnimacion(visorFotografia, "camara-lista", 620);
    } catch (error) {
        // Puede dar error por permiso denegado, conexión insegura o falta de cámara
        console.warn("No se pudo iniciar la cámara en vivo:", error);
        mensajeCamara.textContent = "Toca el botón para abrir la cámara";
    }
}

// Detiene la transmision de la camara
function detenerCamara() {
    if (!transmisionCamara) return;
    transmisionCamara.getTracks().forEach(function (pista) {
        pista.stop();
    });
    transmisionCamara = null;
}

// Guarda un File y crea una URL temporal para poder previsualizarlo localmente
function guardarArchivoComoFoto(archivo) {
    if (fotografias.length >= LIMITE_FOTOS) return false;
    fotografias.push({ archivo: archivo, url: URL.createObjectURL(archivo) });
    fotografiaSeleccionada = fotografias.length - 1;
    return true;
}

// Filtra archivos que sean imágenes y respeta el límite de evidencias
function agregarFotografias(archivos) {
    const imagenes = Array.from(archivos).filter(function (archivo) {
        return archivo.type.startsWith("image/");
    });

    let omitidas = 0;
    imagenes.forEach(function (archivo) {
        if (!guardarArchivoComoFoto(archivo)) omitidas++;
    });

    renderizarGaleriaApilada();
    if (imagenes.length > 0) {
        animarEntradaGaleria();
        animarContador();
    }
    if (visorGaleria.open) renderizarVisor();
    if (omitidas > 0) alert(`Puedes agregar un máximo de ${LIMITE_FOTOS} fotografías.`);
}

// Reinicia la clase css offsetWidth, fuerza el reflujo necesario para que el
// navegador pueda reproducir otra vez una animación con el mismo nombre
function reproducirAnimacion(elemento, clase, duracion) {
    elemento.classList.remove(clase);
    void elemento.offsetWidth;
    elemento.classList.add(clase);
    window.setTimeout(function () {
        elemento.classList.remove(clase);
    }, duracion);
}

// Animacion para que parezca una camara real
function animarCaptura() {
    reproducirAnimacion(visorFotografia, "capturando", 400);
    reproducirAnimacion(destelloCamara, "activo", 340);
    reproducirAnimacion(botonTomarFoto, "disparando", 400);

    // Vibración corta disponible en algunos teléfonos (se ignora si no existe)
    if (navigator.vibrate) navigator.vibrate(35);
}

function animarEntradaGaleria() {
    reproducirAnimacion(abrirVisorGaleria, "foto-agregada", 470);
}

// Se actualiza el contador
function animarContador() {
    reproducirAnimacion(contadorFotos, "actualizado", 410);
}

// Convierte la parte del video (transmision en vivo) a una foto en formato JPEG
function capturarFotografia() {
    if (fotografias.length >= LIMITE_FOTOS) {
        alert(`Ya alcanzaste el máximo de ${LIMITE_FOTOS} fotografías.`);
        return;
    }

    // Si no existe transmisión en vivo, usa el selector nativo con capture
    if (!transmisionCamara || vistaCamara.readyState < 2) {
        inputCamara.click();
        return;
    }

    animarCaptura();

    // Limita la resolución máxima para reducir peso y consumo de memoria
    const anchoOriginal = vistaCamara.videoWidth;
    const altoOriginal = vistaCamara.videoHeight;
    const limite = 1280;
    const escala = Math.min(1, limite / Math.max(anchoOriginal, altoOriginal));

    lienzoCaptura.width = Math.round(anchoOriginal * escala);
    lienzoCaptura.height = Math.round(altoOriginal * escala);
    // canvas copia el fotograma exacto del video antes de convertirlo a JPEG
    lienzoCaptura.getContext("2d").drawImage(vistaCamara, 0, 0, lienzoCaptura.width, lienzoCaptura.height);

    // toBlob genera datos binarios, File los prepara para un futuro FormData
    lienzoCaptura.toBlob(function (blob) {
        if (!blob) return;
        const archivo = new File([blob], `evidencia-${Date.now()}.jpg`, { type: "image/jpeg" });
        guardarArchivoComoFoto(archivo);
        renderizarGaleriaApilada();
        animarEntradaGaleria();
        animarContador();
    }, "image/jpeg", .9);
}

// Dibuja hasta tres fotos superpuestas, en la parte de abajo como las tomas de instagram
function renderizarGaleriaApilada() {
    pilaMiniaturas.innerHTML = "";
    const ultimasFotos = fotografias.slice(-3).reverse();

    ultimasFotos.forEach(function (foto) {
        const imagen = document.createElement("img");
        imagen.src = foto.url;
        imagen.alt = "Fotografía guardada";
        imagen.className = "miniatura-apilada";
        pilaMiniaturas.appendChild(imagen);
    });

    cantidadApilada.textContent = fotografias.length;
    cantidadApilada.hidden = fotografias.length === 0;
    contadorFotos.textContent = `${fotografias.length} / ${LIMITE_FOTOS} fotos`;
}

// Abre el dialog de galería, si no hay fotos, abre directamente el selector
function abrirVisor() {
    if (fotografias.length === 0) {
        inputGaleria.click();
        return;
    }
    fotografiaSeleccionada = Math.min(fotografiaSeleccionada, fotografias.length - 1);
    renderizarVisor();
    visorGaleria.showModal();
    vistaCamara.pause();
}

// Actualiza la foto grande, posición, flechas y miniaturas del dialog
function renderizarVisor() {
    if (fotografias.length === 0) {
        visorGaleria.close();
        return;
    }

    const foto = fotografias[fotografiaSeleccionada];
    fotoModal.src = foto.url;
    posicionFoto.textContent = `${fotografiaSeleccionada + 1} de ${fotografias.length}`;
    fotoAnterior.disabled = fotografias.length < 2;
    fotoSiguiente.disabled = fotografias.length < 2;
    tiraModal.innerHTML = "";

    fotografias.forEach(function (fotografia, indice) {
        const boton = document.createElement("button");
        const imagen = document.createElement("img");
        boton.type = "button";
        boton.className = "miniatura-modal";
        if (indice === fotografiaSeleccionada) boton.classList.add("activa");
        imagen.src = fotografia.url;
        imagen.alt = `Fotografía ${indice + 1}`;
        boton.appendChild(imagen);
        boton.addEventListener("click", function () {
            fotografiaSeleccionada = indice;
            renderizarVisor();
        });
        tiraModal.appendChild(boton);
    });

    const activa = tiraModal.querySelector(".activa");
    if (activa) activa.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

function cambiarFoto(direccion) {
    if (fotografias.length < 2) return;
    fotografiaSeleccionada = (fotografiaSeleccionada + direccion + fotografias.length) % fotografias.length;
    renderizarVisor();
}

// Elimina la foto seleccionada y libera su URL temporal de la memoria
function eliminarFotografiaActual() {
    const eliminada = fotografias.splice(fotografiaSeleccionada, 1)[0];
    if (eliminada) URL.revokeObjectURL(eliminada.url);
    fotografiaSeleccionada = Math.max(0, Math.min(fotografiaSeleccionada, fotografias.length - 1));
    renderizarGaleriaApilada();
    animarContador();
    renderizarVisor();
}

// Eventos de botones principales de cámara y galería
botonTomarFoto.addEventListener("click", capturarFotografia);
abrirGaleria.addEventListener("click", function () { inputGaleria.click(); });
abrirVisorGaleria.addEventListener("click", abrirVisor);
agregarDesdeVisor.addEventListener("click", function () { inputGaleria.click(); });
cerrarVisor.addEventListener("click", function () { visorGaleria.close(); });
eliminarFoto.addEventListener("click", eliminarFotografiaActual);
fotoAnterior.addEventListener("click", function () { cambiarFoto(-1); });
fotoSiguiente.addEventListener("click", function () { cambiarFoto(1); });

// change se ejecuta después de tomar o seleccionar archivos con el sistema
inputCamara.addEventListener("change", function () {
    agregarFotografias(inputCamara.files);
    inputCamara.value = "";
});

inputGaleria.addEventListener("change", function () {
    agregarFotografias(inputGaleria.files);
    inputGaleria.value = "";
});

// La cámara se pausa mientras el visor está abierto y continúa a estar activo al cerrarlo
visorGaleria.addEventListener("close", function () {
    if (transmisionCamara) vistaCamara.play();
});

// Cierra el dialog únicamente cuando se toca su fondo, no su contenido.
visorGaleria.addEventListener("click", function (evento) {
    if (evento.target === visorGaleria) visorGaleria.close();
});

fotoModal.addEventListener("touchstart", function (evento) {
    inicioDeslizamiento = evento.changedTouches[0].clientX;
}, { passive: true });

fotoModal.addEventListener("touchend", function (evento) {
    const distancia = evento.changedTouches[0].clientX - inicioDeslizamiento;
    if (Math.abs(distancia) > 45) cambiarFoto(distancia > 0 ? -1 : 1);
}, { passive: true });

// Valida el formulario y prepara la estructura que despues se pueda usar la API
formularioTicket.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (!formularioTicket.checkValidity()) {
        formularioTicket.reportValidity();
        return;
    }

    // FormData agarra automáticamente los campos que tengan atributo name
    const datos = Object.fromEntries(new FormData(formularioTicket).entries());
    datos.evidencias = fotografias.map(function (foto) { return foto.archivo; });
    console.log("Ticket listo para conectarse con la API:", datos);
});

// pagehide se ejecuta al abandonar la página y evita dejar la cámara encendida
window.addEventListener("pagehide", detenerCamara);

// Inicialización de la interfaz
renderizarCamposTipo(obtenerTipoTicket());
renderizarGaleriaApilada();
iniciarCamara();
