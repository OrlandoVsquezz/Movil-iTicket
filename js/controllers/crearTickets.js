import { crearTicket } from "../services/ticketsService.js";
import { getDepartamentosAsignables } from "../services/departamentosService.js";
import { getUbicaciones } from "../services/ubicacionesService.js";
import { buscarArticulosPorCodigoParcial } from "../services/articulosService.js";
import { subirEvidencia } from "../services/evidenciasService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { validarFormularioTicket } from "../validators/ticketsValidator.js";

const idUsuario = 1; //Temporal

// Cantidad máxima de evidencias permitidas en un ticket
const LIMITE_FOTOS = 5;

// Valores válidos del tipo del ticket
const TIPOS_PERMITIDOS = ["Articulo", "General", "Software"];

// Traduce el tipoTicket a la categoría que espera validarFormularioTicket
const CATEGORIA_POR_TIPO = { "Articulo": "equipos", "General": "general", "Software": "software" };

// Referencias a elementos del DOM para leer campos y actualizar la interfaz.
const formularioTicket = document.getElementById("formCrearTicket");
const tipoTicketInput = document.getElementById("tipoTicket");
const descripcionTipoTicket = document.getElementById("descripcionTipoTicket");
const camposTipoTicket = document.getElementById("camposTipoTicket");
const txtAsunto = document.getElementById("txtAsunto");
const txtDescripcion = document.getElementById("txtDescripcion");
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

let listaCodigosEquipos = [];
let listaSoftwareVersion = [];
let listaDepartamentosDisponibles = [];
let departamentosCargados = false;
let ubicacionesCargadas = false;

// Lee ?tipo= de la URL. Ejemplo: crearTickets.html?tipo=Software.
function obtenerTipoTicket() {
    // URLSearchParams convierte la parte de parámetros de la dirección en datos que se pueden consultar
    const parametros = new URLSearchParams(window.location.search);
    const tipoSolicitado = parametros.get("tipo"); // Se consulta el tipo

    // .includes ve si el valor no es permitido, se utiliza General como opción predeterminada
    return TIPOS_PERMITIDOS.includes(tipoSolicitado) ? tipoSolicitado : "General";
}

// Crea un campo de departamento para los tres tipos de ticket
function campoDepartamento() {
    return `
        <div class="campo-ticket campo-ancho-completo" id="campoDepartamento">
            <label for="sltDepartamento">Departamento:</label>
            <select id="sltDepartamento" required>
                <option value="" selected disabled>Cargando departamentos...</option>
            </select>
        </div>
    `;
}

// Construye los campos dependiendo del tipo recibido por la URL
function renderizarCamposTipo(tipo) {
    tipoTicketInput.value = tipo;

    if (tipo === "Articulo") {
        descripcionTipoTicket.textContent = "Reporta uno o varios equipos o mobiliarios inventariados.";
        camposTipoTicket.innerHTML = `
            <div class="campos-dinamicos">
                <div class="campo-ticket campo-ancho-completo" id="campoCodigo">
                    <label for="txtCodigo">Código del equipo/mobiliario:</label>
                    <div class="control-codigo">
                        <input type="text" id="txtCodigo" placeholder="#456AS31" autocomplete="off">
                        <button type="button" class="boton-agregar-codigo" id="btnAgregarCodigo" aria-label="Agregar código">+</button>
                    </div>
                    <div id="sugerenciasCodigos" class="lista-sugerencias-ticket d-none"></div>
                    <div id="listaCodigos" class="lista-chips-ticket"></div>
                </div>
                ${campoDepartamento()}
            </div>
        `;
        listaCodigosEquipos = [];
        prepararCodigoAutocompletado();
    } else if (tipo === "Software") {
        descripcionTipoTicket.textContent = "Indica el programa, su versión y dónde se encuentra el equipo.";
        camposTipoTicket.innerHTML = `
            <div class="campos-dinamicos">
                <div class="campo-ticket campo-ancho-completo" id="campoSoftware">
                    <label for="txtNombreSoftware">Software a instalar:</label>
                    <div class="control-codigo control-software">
                        <input type="text" id="txtNombreSoftware" placeholder="Nombre del programa" maxlength="50">
                        <input type="text" id="txtVersion" placeholder="Versión" maxlength="20">
                        <button type="button" class="boton-agregar-codigo" id="btnAgregarSoftware" aria-label="Agregar software">+</button>
                    </div>
                    <div id="listaSoftware" class="lista-chips-ticket"></div>
                </div>
                <div class="campo-ticket campo-ancho-completo" id="campoUbicacionSoftware">
                    <label for="sltUbicacionSoftware">Ubicación:</label>
                    <select id="sltUbicacionSoftware" required>
                        <option value="" selected disabled>Cargando ubicaciones...</option>
                    </select>
                </div>
                ${campoDepartamento()}
            </div>
        `;
        listaSoftwareVersion = [];
        prepararSoftwareAdicional();
        cargarUbicaciones();
    } else {
        descripcionTipoTicket.textContent = "Describe la ubicación del problema de electricidad, red u otro servicio.";
        camposTipoTicket.innerHTML = `
            <div class="campos-dinamicos">
                <div class="campo-ticket campo-ancho-completo">
                    <label for="txtUbicacion">Ubicación del problema:</label>
                    <input type="text" id="txtUbicacion"
                        placeholder="Ej. Segundo nivel, aula B-12" required>
                </div>
                ${campoDepartamento()}
            </div>
        `;
    }

    cargarDepartamentos();
}

async function cargarDepartamentos() {
    if (departamentosCargados) return;
    try {
        const departamentos = await getDepartamentosAsignables(idUsuario);
        listaDepartamentosDisponibles = departamentos;

        const sltDepartamento = document.getElementById("sltDepartamento");
        if (!sltDepartamento) return;

        sltDepartamento.innerHTML = '<option value="" selected disabled>Selecciona un departamento...</option>';
        departamentos.forEach((dep) => {
            const opcion = document.createElement("option");
            opcion.value = dep.idDepartamento;
            opcion.textContent = dep.nombreDepartamento;
            sltDepartamento.appendChild(opcion);
        });
        departamentosCargados = true;

        if (tipoTicketInput.value === "Software") {
            forzarDepartamentoIT();
        } else {
            liberarDepartamento();
        }
    } catch (error) {
        console.error("Error al cargar departamentos:", error);
        mostrarError("No se pudieron cargar los departamentos.");
    }
}

//Para tipos de ticket de software
function forzarDepartamentoIT() {
    const sltDepartamento = document.getElementById("sltDepartamento");
    if (!sltDepartamento || listaDepartamentosDisponibles.length === 0) return;

    const departamentoIT = listaDepartamentosDisponibles.find((d) => d.nombreDepartamento.trim().toUpperCase() === "IT");
    if (departamentoIT) sltDepartamento.value = departamentoIT.idDepartamento;
    sltDepartamento.disabled = true;
}

function liberarDepartamento() {
    const sltDepartamento = document.getElementById("sltDepartamento");
    if (sltDepartamento) sltDepartamento.disabled = false;
}

async function cargarUbicaciones() {
    if (ubicacionesCargadas) return;
    try {
        const ubicaciones = await getUbicaciones();
        const sltUbicacionSoftware = document.getElementById("sltUbicacionSoftware");
        if (!sltUbicacionSoftware) return;

        sltUbicacionSoftware.innerHTML = '<option value="" selected disabled>Selecciona la ubicación...</option>';
        ubicaciones.forEach((ubicacion) => {
            const opcion = document.createElement("option");
            opcion.value = ubicacion.id;
            opcion.textContent = ubicacion.nombreUbicacion;
            sltUbicacionSoftware.appendChild(opcion);
        });
        ubicacionesCargadas = true;
    } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
        mostrarError("No se pudieron cargar las ubicaciones.");
    }
}

//Para tipo artículo
function escapeHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

//Rebderiza nuevos codigoss
function renderizarCodigos() {
    const listaCodigos = document.getElementById("listaCodigos");
    if (!listaCodigos) return;
    listaCodigos.innerHTML = "";
    listaCodigosEquipos.forEach((codigo, index) => {
        const chip = document.createElement("span");
        chip.className = "chip-ticket";
        chip.innerHTML = `<span>${escapeHTML(codigo)}</span><button type="button" data-index="${index}" aria-label="Eliminar">×</button>`;
        listaCodigos.appendChild(chip);
    });
}

//Agrega un codigo a la lista
function agregarCodigoArticulo(codigo) {
    if (!codigo) return;
    if (listaCodigosEquipos.includes(codigo)) {
        mostrarError("Este código ya fue agregado.");
        return;
    }
    listaCodigosEquipos.push(codigo);
    renderizarCodigos();
}

function renderizarSugerenciasCodigo(resultados, txtCodigo, sugerenciasCodigos) {
    sugerenciasCodigos.innerHTML = "";
    if (resultados.length === 0) {
        sugerenciasCodigos.classList.add("d-none");
        return;
    }
    resultados.forEach((articulo) => {
        const item = document.createElement("button");
        item.type = "button";
        item.textContent = `${articulo.codigoArticulo} (${articulo.nombreUbicacion})`;
        item.addEventListener("click", function () {
            agregarCodigoArticulo(articulo.codigoArticulo);
            txtCodigo.value = "";
            sugerenciasCodigos.classList.add("d-none");
            sugerenciasCodigos.innerHTML = "";
        });
        sugerenciasCodigos.appendChild(item);
    });
    sugerenciasCodigos.classList.remove("d-none");
}

function prepararCodigoAutocompletado() {
    const txtCodigo = document.getElementById("txtCodigo");
    const btnAgregarCodigo = document.getElementById("btnAgregarCodigo");
    const sugerenciasCodigos = document.getElementById("sugerenciasCodigos");
    const listaCodigos = document.getElementById("listaCodigos");
    let temporizadorBusqueda = null;

    btnAgregarCodigo.addEventListener("click", function () {
        agregarCodigoArticulo(txtCodigo.value.trim());
        txtCodigo.value = "";
        txtCodigo.focus();
    });

    txtCodigo.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            btnAgregarCodigo.click();
        }
    });

    //Hace las peticiones de codigos a la api segun se vaya escribiendo
    txtCodigo.addEventListener("input", function () {
        const fragmento = txtCodigo.value.trim();
        if (fragmento.length < 2) {
            sugerenciasCodigos.classList.add("d-none");
            sugerenciasCodigos.innerHTML = "";
            return;
        }
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(async () => {
            try {
                const resultados = await buscarArticulosPorCodigoParcial(fragmento);
                renderizarSugerenciasCodigo(resultados, txtCodigo, sugerenciasCodigos);
            } catch (error) {
                console.error("Error al buscar artículos:", error);
                sugerenciasCodigos.classList.add("d-none");
            }
        }, 350);
    });

    document.addEventListener("click", function (e) {
        if (!e.target.closest("#campoCodigo")) {
            sugerenciasCodigos.classList.add("d-none");
        }
    });

    listaCodigos.addEventListener("click", function (e) {
        const boton = e.target.closest("button[data-index]");
        if (!boton) return;
        listaCodigosEquipos.splice(Number(boton.dataset.index), 1);
        renderizarCodigos();
    });
}


//Para tipo software
function renderizarSoftwareLista() {
    const listaSoftware = document.getElementById("listaSoftware");
    if (!listaSoftware) return;
    listaSoftware.innerHTML = "";
    listaSoftwareVersion.forEach((item, index) => {
        const chip = document.createElement("span");
        chip.className = "chip-ticket";
        chip.innerHTML = `<span>${escapeHTML(item.nombreSoftware)} — v.${escapeHTML(item.version)}</span><button type="button" data-index="${index}" aria-label="Eliminar">×</button>`;
        listaSoftware.appendChild(chip);
    });
}

function prepararSoftwareAdicional() {
    const txtNombreSoftware = document.getElementById("txtNombreSoftware");
    const txtVersion = document.getElementById("txtVersion");
    const btnAgregarSoftware = document.getElementById("btnAgregarSoftware");
    const listaSoftware = document.getElementById("listaSoftware");

    //Para agregar los software y sus versiones a la lista
    btnAgregarSoftware.addEventListener("click", function () {
        const nombre = txtNombreSoftware.value.trim();
        const version = txtVersion.value.trim();
        if (!nombre || !version) return;

        const yaExiste = listaSoftwareVersion.some((item) => item.nombreSoftware.toLowerCase() === nombre.toLowerCase() && item.version === version);
        if (yaExiste) {
            mostrarError("Este software con esa versión ya fue agregado.");
            return;
        }

        listaSoftwareVersion.push({ nombreSoftware: nombre, version: version });
        txtNombreSoftware.value = "";
        txtVersion.value = "";
        renderizarSoftwareLista();
        txtNombreSoftware.focus();
    });

    [txtNombreSoftware, txtVersion].forEach((input) => {
        input.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                btnAgregarSoftware.click();
            }
        });
    });

    //Para eliminar de la lista
    listaSoftware.addEventListener("click", function (e) {
        const boton = e.target.closest("button[data-index]");
        if (!boton) return;
        listaSoftwareVersion.splice(Number(boton.dataset.index), 1);
        renderizarSoftwareLista();
    });
}

//Para el formulario de envio 
formularioTicket.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    document.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));

    const tipo = tipoTicketInput.value;
    const categoria = CATEGORIA_POR_TIPO[tipo];

    const datosFormulario = {
        asunto: txtAsunto.value,
        descripcion: txtDescripcion.value,
        idDepartamento: document.getElementById("sltDepartamento").value,
        ubicacion: document.getElementById("txtUbicacion")?.value ?? "",
        listaCodigos: listaCodigosEquipos,
        listaSoftware: listaSoftwareVersion,
        idUbicacionSoftware: document.getElementById("sltUbicacionSoftware")?.value ?? ""
    };

    const errores = validarFormularioTicket(categoria, datosFormulario);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo);
            if (campo) campo.classList.add("is-invalid");
        });
        mostrarError(errores.map((error) => error.mensaje).join(" "));
        return;
    }

    const confirmar = await mostrarConfirmacion("¿Estás seguro de crear el ticket?", "Podrás eliminarlo o editarlo mientras no se apruebe", "Crear");
    if (!confirmar) return;

    const nuevoTicket = {
        asunto: datosFormulario.asunto.trim(),
        descripcion: datosFormulario.descripcion.trim(),
        departamento: Number(datosFormulario.idDepartamento),
        creador: Number(idUsuario),
        tipoTicket: tipo
    };

    if (tipo === "Articulo") {
        nuevoTicket.codigosArticulos = listaCodigosEquipos;
    } else if (tipo === "General") {
        nuevoTicket.descripcionUbicacion = datosFormulario.ubicacion.trim();
    } else if (tipo === "Software") {
        nuevoTicket.detallesSoftware = listaSoftwareVersion.map((item) => ({
            nombreSoftware: item.nombreSoftware,
            version: item.version,
            ubicacion: Number(datosFormulario.idUbicacionSoftware)
        }));
    }

    try {
        const respuestaTicket = await crearTicket(nuevoTicket);
        const idTicketCreado = respuestaTicket.data.idTicket;

        if (fotografias.length > 0) {
            const subidas = fotografias.map((foto) => subirEvidencia(foto.archivo, idTicketCreado));
            await Promise.all(subidas);
        }

        mostrarExitoSimple("¡Ticket creado!", "Tu ticket fue registrado correctamente.");
        limpiarFormularioCreacion();
    } catch (error) {
        console.error("Error al crear el ticket:", error);
        mostrarError("No se pudo crear el ticket. Por favor, revisa si los datos son correctos.");
    }
});

function limpiarFormularioCreacion() {
    txtAsunto.value = "";
    txtDescripcion.value = "";
    ["txtDescripcionUbicacion", "txtCodigo", "txtNombreSoftware", "txtVersion"].forEach((id) => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    listaCodigosEquipos = [];
    listaSoftwareVersion = [];
    renderizarCodigos();
    renderizarSoftwareLista();

    if (tipoTicketInput.value === "Software") {
        forzarDepartamentoIT();
    } else {
        const sltDepartamento = document.getElementById("sltDepartamento");
        if (sltDepartamento) sltDepartamento.value = "";
    }
    const sltUbicacionSoftware = document.getElementById("sltUbicacionSoftware");
    if (sltUbicacionSoftware) sltUbicacionSoftware.value = "";

    fotografias.forEach((foto) => URL.revokeObjectURL(foto.url));
    fotografias = [];
    fotografiaSeleccionada = 0;
    renderizarGaleriaApilada();
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
        mostrarError(`Ya alcanzaste el máximo de ${LIMITE_FOTOS} fotografías.`);
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

// pagehide se ejecuta al abandonar la página y evita dejar la cámara encendida
window.addEventListener("pagehide", detenerCamara);

// Inicialización de la interfaz
renderizarCamposTipo(obtenerTipoTicket());
renderizarGaleriaApilada();
iniciarCamara();
