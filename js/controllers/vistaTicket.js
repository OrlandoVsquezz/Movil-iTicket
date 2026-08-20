import { getTicket, editarComoCreador, editarComoGestor, editarEstadoAsignado, reportarTicket } from "../services/ticketsService.js";
import { obtenerEvidenciasPorTicket, eliminarEvidencia, subirEvidencia } from "../services/evidenciasService.js";
import { getDepartamentosAsignables } from "../services/departamentosService.js";
import { getUbicaciones } from "../services/ubicacionesService.js";
import { buscarArticulosPorCodigoParcial } from "../services/articulosService.js";
import { getTecnicosPorDepartamento } from "../services/usuariosService.js";
import { mostrarError, mostrarExitoSimple, mostrarConfirmacion } from "../components/sweetAlerts.js";
import { validarFormularioTicket, validarFormularioAprobacion, validarFormularioReporte } from "../validators/ticketsValidator.js";
import { obtenerPermisos } from "../validators/permisosTicket.js";
import { getBitacorasPorTicket } from "../services/bitacorasService.js";
import { crearComentario, obtenerComentariosPorTicket, eliminarComentario } from "../services/comentariosService.js";
import { subirMultimediaComentario } from "../services/multimediaComentariosService.js";
import { formatearFecha24H, formatearFecha12H, formatearParaDateTimeLocal } from "../utils/formateadores.js";
import { validarFormularioComentario } from "../validators/comentariosValidator.js";

const CATEGORIA_POR_TIPO = { "Articulo": "equipos", "General": "general", "Software": "software" };
const limiteEvidenciasTicket = 5;
const limiteMultimediaComentario = 3;

const btnVolver = document.getElementById("btnVolver");
const targetaTicket = document.getElementById("targetaTicket");
const galeriaEvidenciasVista = document.getElementById("galeriaEvidenciasVista");

//Botones de edición
const btnAbrirEdicionCreador = document.getElementById("btnAbrirEdicionCreador");
const btnAbrirReasignacion = document.getElementById("btnAbrirReasignacion");
const btnAbrirEstadoAsignado = document.getElementById("btnAbrirEstadoAsignado");
const btnGestionarReporte = document.getElementById("btnGestionarReporte");

//Dialog para edición de creador
const dialogEdicionCreador = document.getElementById("dialogEdicionCreador");
const frmEdicionCreador = document.getElementById("frmEdicionCreador");
const txtAsuntoEdicion = document.getElementById("txtAsuntoEdicion");
const txtDescripcionEdicion = document.getElementById("txtDescripcionEdicion");
const sltDepartamentoEdicion = document.getElementById("sltDepartamentoEdicion");
const campoCodigoEdicion = document.getElementById("campoCodigoEdicion");
const campoUbicacionEdicion = document.getElementById("campoUbicacionEdicion");
const campoSoftwareEdicion = document.getElementById("campoSoftwareEdicion");

const galeriaMultimediaEdicion = document.getElementById("galeriaMultimediaEdicion");
const btnAgregarEvidenciaEdicion = document.getElementById("btnAgregarEvidenciaEdicion");
const inputEvidenciaEdicion = document.getElementById("inputEvidenciaEdicion");

//Para tipo articulo
const txtCodigoEdicion = document.getElementById("txtCodigoEdicion");
const btnAgregarCodigoEdicion = document.getElementById("btnAgregarCodigoEdicion");
const sugerenciasCodigosEdicion = document.getElementById("sugerenciasCodigosEdicion");
const listaCodigosEdicion = document.getElementById("listaCodigosEdicion");

//Para tipo general
const txtUbicacionEdicion = document.getElementById("txtUbicacionEdicion");

//Para tipo software
const txtNombreSoftwareEdicion = document.getElementById("txtNombreSoftwareEdicion");
const txtVersionEdicion = document.getElementById("txtVersionEdicion");
const btnAgregarSoftwareEdicion = document.getElementById("btnAgregarSoftwareEdicion");
const listaSoftwareEdicion = document.getElementById("listaSoftwareEdicion");
const sltUbicacionSoftwareEdicion = document.getElementById("sltUbicacionSoftwareEdicion");

//Dialog para cambiar estado (técnico asignado)
const dialogEstadoAsignado = document.getElementById("dialogEstadoAsignado");
const frmEstadoAsignado = document.getElementById("frmEstadoAsignado");
const sltEstadoAsignado = document.getElementById("sltEstadoAsignado");

//Dialog de reporte técnico
const cardReporteTecnico = document.getElementById("cardReporteTecnico");
const dialogReporte = document.getElementById("dialogReporte");
const frmReporteTicket = document.getElementById("frmReporteTicket");
const txtDescripcionFalla = document.getElementById("txtDescripcionFalla");
const txtDescripcionSolucion = document.getElementById("txtDescripcionSolucion");
const txtBotonReporte = document.getElementById("txtBotonReporte");

//Dialog de reasignación (para admin)
const dialogReasignacion = document.getElementById("dialogReasignacion");
const frmReasignacion = document.getElementById("frmReasignacion");
const sltPrioridadEdicion = document.getElementById("sltPrioridadEdicion");
const sltTecnicoEdicion = document.getElementById("sltTecnicoEdicion");
const dtFechaVencimientoEdicion = document.getElementById("dtFechaVencimientoEdicion");

const tablaBitacora = document.getElementById("tablaBitacora");

//Comentarios
const listaComentarios = document.getElementById("listaComentarios");
const frmComentario = document.getElementById("frmComentario");
const txtComentario = document.getElementById("txtComentario");
const btnEnviarComentario = document.getElementById("btnEnviarComentario");
const btnAdjuntarComentario = document.getElementById("btnAdjuntarComentario");
const inputComentarioMultimedia = document.getElementById("inputComentarioMultimedia");
const galeriaComentarioAdjuntos = document.getElementById("galeriaComentarioAdjuntos");

//Vista previa de imágenes
const dialogVistaPrevia = document.getElementById("dialogVistaPrevia");
const imgVistaPrevia = document.getElementById("imgVistaPrevia");

let idTicketActual = null;
let ticketActual = null;
let evidenciasActuales = [];
let archivosNuevosEvidencia = [];
let listaCodigosEquipos = [];
let listaSoftwareVersion = [];
let departamentosCargados = false;
let listaDepartamentosDisponibles = [];
let ubicacionesCargadas = false;
let temporizadorBusqueda = null;
let comentariosActuales = [];
let archivosComentarioSeleccionados = [];

const idUsuario = 1//Temporal
const rol = "administrador"

document.addEventListener("DOMContentLoaded", () => {
    if (btnVolver) {
        btnVolver.addEventListener("click", function (e) {
            if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
                e.preventDefault();
                window.history.back();
            }
        });
    }

    idTicketActual = obtenerIdTicketDesdeURL();
    if (!idTicketActual) {
        mostrarError("No se especificó el ticket a mostrar.");
        return;
    }

    cargarTicket();
    cargarBitacoras();
});

//Para cerrar los dialog
document.addEventListener("click", (e) => {
    const botonCerrar = e.target.closest("[data-dialog-close]");
    if (botonCerrar) {
        botonCerrar.closest("dialog")?.close();
    }
});

document.querySelectorAll(".ticket-dialog").forEach((dialogEl) => {
    dialogEl.addEventListener("click", (e) => {
        if (e.target === dialogEl) dialogEl.close();
    });
});

function obtenerIdTicketDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("id");
}

//Cargar y mostrar datos del ticket
async function cargarTicket() {
    try {
        const [ticket, evidencias, comentarios] = await Promise.all([
            getTicket(idTicketActual),
            obtenerEvidenciasPorTicket(idTicketActual),
            obtenerComentariosPorTicket(idTicketActual)
        ]);

        ticketActual = ticket;
        evidenciasActuales = evidencias || [];
        comentariosActuales = comentarios || [];

        renderizarVista();
        configurarPermisos();
        renderizarReporte();
        renderizarComentarios();
    } catch (error) {
        console.error("Error al cargar el ticket:", error);
        mostrarError("No se pudo cargar la información del ticket.");
    }
}

function renderizarVista() {
    const t = ticketActual;
    const prio = t.prioridad || '';

    let software = "";
    let articulos = "";

    if (t.tipoTicket === "Articulo" && t.codigosArticulos?.length) {
        articulos = t.codigosArticulos.join(", ");
    }
    if (t.tipoTicket === "Software" && t.detallesSoftware?.length) {
        software = t.detallesSoftware.map((sw) => `${sw.nombreSoftware} (v.${sw.version})`).join(", ");
    }

    targetaTicket.innerHTML = `
        <header class="ticket-header">
            <div class="ticket-title-group">
                <i class="bi bi-ticket-perforated bi-${prio} me-2"></i>
                <span class="dot">•</span>
                <h2 class="ticket-title texto-limitado">${t.asunto}</h2>
            </div>
            <div class="header-actions">
                <span class="badge prioridad-${prio}">${prio}</span>
            </div>
        </header>
        <div class="mb-2">
            <div class="ticket-details">
                <p class="ticket-code">${t.codigo}</p>
                <p class="ticket-info"><strong>Estado:</strong> ${t.estado}</p>
                <p class="ticket-info"><strong>Creado:</strong> ${formatearFecha12H(t.fechaCreacion)}</p>
                ${t.fechaVencimiento ? `<p class="ticket-info"><strong>Vence:</strong> ${formatearFecha12H(t.fechaVencimiento)}</p> ` : ''}
                ${t.correoTecnico ? `<p class="ticket-info"><strong>Técnico asignado:</strong> ${t.nombreTecnico}</p> ` : ''}
            </div>

            <div class="ticket-description mb-2">
                <p class="description-title">Descripción:</p>
                <p class="description-text">${t.descripcion}</p>
            </div>
            <div class="ticket-details">
                <p class="ticket-info"><strong>Ubicación:</strong> ${t.ubicacion}</p>
                ${software ? `<p class="ticket-info"><strong>Software a instalar:</strong> ${software}</p> ` : ''}
                ${articulos ? `<p class="ticket-info"><strong>Artículos:</strong> ${articulos}</p> ` : ''}
            </div>
        </div>
    `;
    renderizarGaleriaVista();
}

//Para mostrar las evidencias del ticket
function renderizarGaleriaVista() {
    galeriaEvidenciasVista.innerHTML = "";

    //Si no hay evidencias, centra el texto y le quita la clase contenedor
    if (evidenciasActuales.length === 0) {
        galeriaEvidenciasVista.classList.remove("contenedor-evidencias");
        galeriaEvidenciasVista.classList.add("contenedor-evidencias-null");
        galeriaEvidenciasVista.innerHTML = `<p class="text-muted small mb-0">Sin evidencias adjuntas.</p>`;
        return;
    }
    galeriaEvidenciasVista.classList.add("contenedor-evidencias");

    //renderiza cada evidencia una despues de la otra en el contenedro
    evidenciasActuales.forEach((evidencia) => {
        galeriaEvidenciasVista.insertAdjacentHTML("beforeend", `
            <div class="tarjeta-foto-evidencia overflow-hidden rounded-3" onclick="abrirVistaImagen('${evidencia.evidenciaUrl}')">
                <img src="${evidencia.evidenciaUrl}" alt="Evidencia" class="img-fluid object-fit-cover w-100 h-100" />
            </div>
        `);
    });
}

//Para controlar los permisos de edicion del usuario
function configurarPermisos() {
    const permisos = obtenerPermisos(ticketActual, idUsuario, rol);

    btnAbrirEdicionCreador.classList.toggle("d-none", !permisos.editarCreador);
    btnAbrirReasignacion.classList.toggle("d-none", !permisos.reasignar);
    btnAbrirEstadoAsignado.classList.toggle("d-none", !permisos.cambiarEstado);
    btnGestionarReporte.classList.toggle("d-none", !permisos.reportar);
}

//Dialog edicion de ticket(para creador)

//Selecciona el departamento IT por defecto ya que los tickets de instalación de software siempre serán para IT
function forzarDepartamentoIT() {
    if (!sltDepartamentoEdicion || listaDepartamentosDisponibles.length === 0) return;

    const departamentoIT = listaDepartamentosDisponibles.find((d) => d.nombreDepartamento.trim().toUpperCase() === "IT");
    if (departamentoIT) {
        sltDepartamentoEdicion.value = departamentoIT.idDepartamento;
    }
    sltDepartamentoEdicion.disabled = true;
}

function liberarDepartamento() {
    if (!sltDepartamentoEdicion) return;
    sltDepartamentoEdicion.disabled = false;
}

//Abre el dialog de edicion y carga los datos
btnAbrirEdicionCreador?.addEventListener("click", async () => {
    const t = ticketActual;

    document.querySelectorAll("#frmEdicionCreador .dialog-campo").forEach((campo) => {
        campo.classList.remove("is-invalid");
    });

    txtAsuntoEdicion.value = t.asunto;
    txtDescripcionEdicion.value = t.descripcion;

    //Primero se ocultan los campos dinamicos
    campoCodigoEdicion.classList.add("d-none");
    campoUbicacionEdicion.classList.add("d-none");
    campoSoftwareEdicion.classList.add("d-none");

    //Lista de equipos(para tickets de tipo Artículo) y lista de software a instalar con su versión
    listaCodigosEquipos = [];
    listaSoftwareVersion = [];

    await cargarDepartamentosEdicion();
    sltDepartamentoEdicion.value = t.departamento;
    liberarDepartamento();

    // mostrar y precargar el campo dinamico según tipoTicket
    if (t.tipoTicket === "Articulo") {
        campoCodigoEdicion.classList.remove("d-none");
        listaCodigosEquipos = [...(t.codigosArticulos ?? [])];
        renderizarCodigosEdicion();
    } else if (t.tipoTicket === "General") {
        campoUbicacionEdicion.classList.remove("d-none");
        txtUbicacionEdicion.value = t.ubicacion;
    } else if (t.tipoTicket === "Software") {
        campoSoftwareEdicion.classList.remove("d-none");
        listaSoftwareVersion = (t.detallesSoftware ?? []).map((sw) => ({ nombreSoftware: sw.nombreSoftware, version: sw.version }));
        renderizarSoftwareEdicion();
        await cargarUbicacionesEdicion();
        preseleccionarUbicacionSoftware(t.ubicacion);
        forzarDepartamentoIT();
    }

    //Resetea la galeria cada vez que se abre el dialog
    archivosNuevosEvidencia = [];
    renderizarGaleriaEdicion();
    dialogEdicionCreador.showModal();
});

//Cargar departamentos asignables
async function cargarDepartamentosEdicion() {
    if (departamentosCargados) return;
    try {
        const departamentos = await getDepartamentosAsignables(idUsuario);
        listaDepartamentosDisponibles = departamentos;

        sltDepartamentoEdicion.innerHTML = '<option value="" selected disabled>Selecciona un departamento...</option>';
        departamentos.forEach((dep) => {
            const opcion = document.createElement("option");
            opcion.value = dep.idDepartamento;
            opcion.textContent = dep.nombreDepartamento;
            sltDepartamentoEdicion.appendChild(opcion);
        });
        departamentosCargados = true;
    } catch (error) {
        console.error("Error al cargar departamentos:", error);
        mostrarError("No se pudieron cargar los departamentos.");
    }
}

//Renderizar los "badges" de codigos
function renderizarCodigosEdicion() {
    listaCodigosEdicion.innerHTML = "";
    listaCodigosEquipos.forEach((codigo, index) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.innerHTML = `<span>${escapeHTML(codigo)}</span><button type="button" data-index="${index}" aria-label="Eliminar">×</button>`;
        listaCodigosEdicion.appendChild(chip);
    });
}

//Para eliminar badges de codigos
listaCodigosEdicion?.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-index]");
    if (!boton) return;
    listaCodigosEquipos.splice(Number(boton.dataset.index), 1);
    renderizarCodigosEdicion();
});

//Para agregar un nuevo codigo a la lista
function agregarCodigoEdicion(codigo) {
    if (!codigo) return;
    if (listaCodigosEquipos.includes(codigo)) {
        dialogEdicionCreador.close();
        mostrarError("Este código ya fue agregado.").then(() => dialogEdicionCreador.showModal());
        return;
    }
    listaCodigosEquipos.push(codigo);
    renderizarCodigosEdicion();
}

btnAgregarCodigoEdicion?.addEventListener("click", () => {
    agregarCodigoEdicion(txtCodigoEdicion.value.trim());
    txtCodigoEdicion.value = "";
    txtCodigoEdicion.focus();
});

txtCodigoEdicion?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnAgregarCodigoEdicion.click();
    }
});

//Busca sugerencias de codigos de articulos siempre y cuando se escriban mas de 2 caracteres
//Espera 350 milisegundos despues de que el usuario deja de escribir para hacer la peticion
txtCodigoEdicion?.addEventListener("input", () => {
    const fragmento = txtCodigoEdicion.value.trim();
    if (fragmento.length < 2) {
        sugerenciasCodigosEdicion.classList.add("d-none");
        sugerenciasCodigosEdicion.innerHTML = "";
        return;
    }
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(async () => {
        try {
            const resultados = await buscarArticulosPorCodigoParcial(fragmento);
            renderizarSugerenciasCodigo(resultados);
        } catch (error) {
            console.error("Error al buscar artículos:", error);
            sugerenciasCodigosEdicion.classList.add("d-none");
        }
    }, 350);
});

//cierra la lista desplegable de sugerencias cuando el usuario hace clic en cualquier lugar fuera del buscador
document.addEventListener("click", (e) => {
    if (!e.target.closest("#campoCodigoEdicion")) {
        sugerenciasCodigosEdicion?.classList.add("d-none");
    }
});

function renderizarSugerenciasCodigo(resultados) {
    sugerenciasCodigosEdicion.innerHTML = "";
    if (resultados.length === 0) {
        sugerenciasCodigosEdicion.classList.add("d-none");
        return;
    }
    resultados.forEach((articulo) => {
        const item = document.createElement("button");
        item.type = "button";
        item.textContent = `${articulo.codigoArticulo} (${articulo.nombreUbicacion})`;
        item.addEventListener("click", () => {
            agregarCodigoEdicion(articulo.codigoArticulo);
            txtCodigoEdicion.value = "";
            sugerenciasCodigosEdicion.classList.add("d-none");
            sugerenciasCodigosEdicion.innerHTML = "";
        });
        sugerenciasCodigosEdicion.appendChild(item);
    });
    sugerenciasCodigosEdicion.classList.remove("d-none");
}

//Para tipo software, renderiza un "badge" con el nombre del software y la version 
function renderizarSoftwareEdicion() {
    listaSoftwareEdicion.innerHTML = "";
    listaSoftwareVersion.forEach((item, index) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.innerHTML = `<span>${escapeHTML(item.nombreSoftware)} — v.${escapeHTML(item.version)}</span><button type="button" data-index="${index}" aria-label="Eliminar">×</button>`;
        listaSoftwareEdicion.appendChild(chip);
    });
}

//Para eliminar un software con su version de la lista
listaSoftwareEdicion?.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-index]");
    if (!boton) return;
    listaSoftwareVersion.splice(Number(boton.dataset.index), 1);
    renderizarSoftwareEdicion();
});

//Agrega el software con su version a la lista y valida que no sea igual a uno anterior
btnAgregarSoftwareEdicion?.addEventListener("click", () => {
    const nombre = txtNombreSoftwareEdicion.value.trim();
    const version = txtVersionEdicion.value.trim();
    if (!nombre || !version) return;

    const yaExiste = listaSoftwareVersion.some((item) => item.nombreSoftware.toLowerCase() === nombre.toLowerCase() && item.version === version);
    if (yaExiste) {
        dialogEdicionCreador.close();
        mostrarError("Este software con esa versión ya fue agregado.").then(() => dialogEdicionCreador.showModal());
        return;
    }

    listaSoftwareVersion.push({ nombreSoftware: nombre, version });
    txtNombreSoftwareEdicion.value = "";
    txtVersionEdicion.value = "";
    renderizarSoftwareEdicion();
    txtNombreSoftwareEdicion.focus();
});

//Carga ubicaciones de la base
async function cargarUbicacionesEdicion() {
    if (ubicacionesCargadas) return;
    try {
        const ubicaciones = await getUbicaciones();
        sltUbicacionSoftwareEdicion.innerHTML = '<option value="" selected disabled>Selecciona la ubicación...</option>';
        ubicaciones.forEach((ubicacion) => {
            const opcion = document.createElement("option");
            opcion.value = ubicacion.id;
            opcion.textContent = ubicacion.nombreUbicacion;
            sltUbicacionSoftwareEdicion.appendChild(opcion);
        });
        ubicacionesCargadas = true;
    } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
        mostrarError("No se pudieron cargar las ubicaciones.");
    }
}

//Para cargar la ubicacion del ticket en el select, compara el nombre con los elementos del select y obtiene el id
function preseleccionarUbicacionSoftware(nombreUbicacion) {
    if (!nombreUbicacion) return;
    const opcion = Array.from(sltUbicacionSoftwareEdicion.options).find((option) => option.textContent === nombreUbicacion);
    if (opcion) sltUbicacionSoftwareEdicion.value = opcion.value;
}

//Para renderizar la galeria de evidencias y poder editarlas
function renderizarGaleriaEdicion() {
    galeriaMultimediaEdicion.innerHTML = "";

    evidenciasActuales.forEach((ev) => {
        const miniatura = document.createElement("div");
        miniatura.className = "miniatura-foto";
        miniatura.innerHTML = `
            <img src="${ev.evidenciaUrl}" alt="Evidencia">
            <button type="button" class="btn-eliminar-foto btn-eliminar-evidencia" data-id-evidencia="${ev.idEvidencia}" aria-label="Eliminar evidencia">
                <i class="bi bi-x"></i>
            </button>
        `;
        galeriaMultimediaEdicion.appendChild(miniatura);
    });

    //Las evidencias nuevas se leen con FileReader(que las convierte a base64) para poder mostrar una vista previa
    archivosNuevosEvidencia.forEach((archivo, index) => {
        const lector = new FileReader();
        lector.onload = function (e) {
            const miniatura = document.createElement("div");
            miniatura.className = "miniatura-foto";
            miniatura.innerHTML = `
                <img src="${e.target.result}" alt="Nueva evidencia">
                <button type="button" class="btn-eliminar-foto btn-eliminar-nueva" data-index="${index}" aria-label="Eliminar foto">
                    <i class="bi bi-x"></i>
                </button>
            `;
            galeriaMultimediaEdicion.appendChild(miniatura);
        };
        lector.readAsDataURL(archivo);
    });

    btnAgregarEvidenciaEdicion.disabled = (evidenciasActuales.length + archivosNuevosEvidencia.length) >= limiteEvidenciasTicket;
}

btnAgregarEvidenciaEdicion?.addEventListener("click", () => inputEvidenciaEdicion.click());

//Para ingresar nuevas evidencias validando que no sobrepasen el limite
inputEvidenciaEdicion?.addEventListener("change", function () {
    const nuevosArchivos = Array.from(this.files);
    const espacioDisponible = limiteEvidenciasTicket - evidenciasActuales.length - archivosNuevosEvidencia.length;

    //Recorda el sobrante si se seleccionaron mas del limite
    if (nuevosArchivos.length > espacioDisponible) {
        archivosNuevosEvidencia = archivosNuevosEvidencia.concat(nuevosArchivos.slice(0, Math.max(espacioDisponible, 0)));
        dialogEdicionCreador.close();
        mostrarError(`Solo puedes tener un máximo de ${limiteEvidenciasTicket} evidencias por ticket.`).then(() => dialogEdicionCreador.showModal());
    } else {
        archivosNuevosEvidencia = archivosNuevosEvidencia.concat(nuevosArchivos);
    }

    renderizarGaleriaEdicion();
    this.value = "";
});

//Para eliminar evidencias
galeriaMultimediaEdicion?.addEventListener("click", async (e) => {
    const btnEliminarExistente = e.target.closest(".btn-eliminar-evidencia");
    if (btnEliminarExistente) {
        const idEvidencia = Number(btnEliminarExistente.dataset.idEvidencia);

        dialogEdicionCreador.close();
        const confirmar = await mostrarConfirmacion("¿Eliminar esta evidencia?", "Esta acción no se puede revertir", "Eliminar");

        if (confirmar) {
            try {
                await eliminarEvidencia(idEvidencia);
                evidenciasActuales = evidenciasActuales.filter((ev) => ev.idEvidencia !== idEvidencia);
                renderizarGaleriaEdicion();
                renderizarGaleriaVista();
            } catch (error) {
                console.error("Error al eliminar evidencia:", error);
                mostrarError("No se pudo eliminar la evidencia.");
            }
        }

        dialogEdicionCreador.showModal(); //reabrimos siempre ya sea si canceló, tuvo éxito o falló
        return;
    }

    const btnEliminarNueva = e.target.closest(".btn-eliminar-nueva");
    if (btnEliminarNueva) {
        archivosNuevosEvidencia.splice(Number(btnEliminarNueva.dataset.index), 1);
        renderizarGaleriaEdicion();
    }
});

//Traduce los campos que devuelve validarFormularioTicket a los ids de los contenedores .dialog-campo del dialog
const mapeoCamposEdicionCreador = {
    txtAsunto: "campoAsuntoEdicion",
    txtDescripcion: "campoDescripcionEdicion",
    sltDepartamento: "campoDepartamentoEdicion",
    txtCodigo: "campoCodigoEdicion",
    txtUbicacion: "campoUbicacionEdicion",
    txtNombreSoftware: "campoSoftwareEdicion",
    txtVersion: "campoSoftwareEdicion",
    sltUbicacionSoftware: "campoSoftwareEdicion"
};

frmEdicionCreador?.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelectorAll("#frmEdicionCreador .dialog-campo").forEach((campo) => {
        campo.classList.remove("is-invalid");
    });

    const categoria = CATEGORIA_POR_TIPO[ticketActual.tipoTicket];
    const datosFormulario = {
        asunto: txtAsuntoEdicion.value,
        descripcion: txtDescripcionEdicion.value,
        idDepartamento: sltDepartamentoEdicion.value,
        ubicacion: txtUbicacionEdicion.value,
        listaCodigos: listaCodigosEquipos,
        listaSoftware: listaSoftwareVersion,
        idUbicacionSoftware: sltUbicacionSoftwareEdicion.value
    };

    const errores = validarFormularioTicket(categoria, datosFormulario);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const idCampo = mapeoCamposEdicionCreador[error.campo] ?? error.campo;
            const campo = document.getElementById(idCampo);
            if (campo) {
                campo.classList.add("is-invalid");
                const elementoError = campo.querySelector(".dialog-error");
                if (elementoError) elementoError.textContent = error.mensaje;
            }
        });
        return;
    }

    const dto = {
        asunto: datosFormulario.asunto.trim(),
        descripcion: datosFormulario.descripcion.trim(),
        departamento: Number(datosFormulario.idDepartamento)
    };

    if (ticketActual.tipoTicket === "Articulo") {
        dto.codigosArticulos = listaCodigosEquipos;
    } else if (ticketActual.tipoTicket === "General") {
        dto.descripcionUbicacion = datosFormulario.ubicacion.trim();
    } else if (ticketActual.tipoTicket === "Software") {
        dto.detallesSoftware = listaSoftwareVersion.map((item) => ({
            nombreSoftware: item.nombreSoftware,
            version: item.version,
            ubicacion: Number(datosFormulario.idUbicacionSoftware)
        }));
    }

    try {
        await editarComoCreador(idTicketActual, dto, idUsuario);

        if (archivosNuevosEvidencia.length > 0) {
            const subidas = archivosNuevosEvidencia.map((archivo) => subirEvidencia(archivo, idTicketActual));
            await Promise.all(subidas);
        }

        dialogEdicionCreador.close();
        mostrarExitoSimple("¡Ticket actualizado!", "Los cambios se guardaron correctamente.");
        await cargarTicket();
    } catch (error) {
        console.error("Error al editar el ticket:", error);
        dialogEdicionCreador.close();
        mostrarError(error.message || "No se pudo actualizar el ticket.").then(() => dialogEdicionCreador.showModal());
    }
});

//Dialog de edición de estado (para técnico asignado)
btnAbrirEstadoAsignado?.addEventListener("click", () => {
    if (["En proceso", "En espera"].includes(ticketActual.estado)) {
        sltEstadoAsignado.value = ticketActual.estado;
    }
    dialogEstadoAsignado.showModal();
});

frmEstadoAsignado?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        await editarEstadoAsignado(idTicketActual, sltEstadoAsignado.value, idUsuario);
        dialogEstadoAsignado.close();
        mostrarExitoSimple("¡Estado actualizado!", "El estado del ticket fue actualizado.");
        await cargarTicket();
        await cargarBitacoras();
    } catch (error) {
        console.error("Error al actualizar el estado:", error);
        dialogEstadoAsignado.close();
        mostrarError(error.message || "No se pudo actualizar el estado del ticket.").then(() => dialogEstadoAsignado.showModal());
    }
});

function escapeHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

//Dialog y apartado de reporte técnico
function renderizarReporte() {
    const t = ticketActual;

    if (t.descripcionFalla && t.descripcionSolucion) {
        cardReporteTecnico.innerHTML = `
            <p class="ticket-info mb-3"><strong>Técnico:</strong> ${escapeHTML(t.correoTecnico ?? "")}</p>
            <p class="description-title">Falla:</p>
            <p class="description-text mb-3">${escapeHTML(t.descripcionFalla)}</p>
            <p class="description-title">Solución:</p>
            <p class="description-text">${escapeHTML(t.descripcionSolucion)}</p>
        `;
        txtBotonReporte.textContent = "Editar reporte";
        txtDescripcionFalla.value = t.descripcionFalla;
        txtDescripcionSolucion.value = t.descripcionSolucion;
    } else {
        cardReporteTecnico.innerHTML = `<p class="text-muted mb-0">Aún no se ha registrado un reporte para este ticket.</p>`;
        txtBotonReporte.textContent = "Agregar reporte";
        txtDescripcionFalla.value = "";
        txtDescripcionSolucion.value = "";
    }
}

//Para abrir el dialog
btnGestionarReporte?.addEventListener("click", () => {
    dialogReporte.showModal();
});

frmReporteTicket?.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelectorAll("#frmReporteTicket .dialog-campo").forEach((campo) => {
        campo.classList.remove("is-invalid");
    });

    const datos = {
        descripcionFalla: txtDescripcionFalla.value,
        descripcionSolucion: txtDescripcionSolucion.value
    };

    const errores = validarFormularioReporte(datos);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(error.campo)?.closest(".dialog-campo");
            if (campo) {
                campo.classList.add("is-invalid");
                campo.querySelector(".dialog-error").textContent = error.mensaje;
            }
        });
        return;
    }

    try {
        await reportarTicket(idTicketActual, {
            descripcionFalla: datos.descripcionFalla.trim(),
            descripcionSolucion: datos.descripcionSolucion.trim()
        }, idUsuario);

        dialogReporte.close();
        mostrarExitoSimple("¡Reporte guardado!", "El ticket pasó a estado 'Resuelto'.");
        await cargarTicket();
    } catch (error) {
        console.error("Error al guardar el reporte:", error);
        dialogReporte.close();
        mostrarError(error.message || "No se pudo guardar el reporte.").then(() => dialogReporte.showModal());
    }
});

//Dialog para reasignar ticket
async function cargarTecnicosEdicion() {
    try {
        const tecnicos = await getTecnicosPorDepartamento(ticketActual.departamento);
        sltTecnicoEdicion.innerHTML = '<option value="" selected disabled>Selecciona un técnico...</option>';
        tecnicos.forEach((tecnico) => {
            const opcion = document.createElement("option");
            opcion.value = tecnico.idUsuario;
            opcion.textContent = `${tecnico.correo} (${tecnico.nombreRol})`;
            sltTecnicoEdicion.appendChild(opcion);
        });
    } catch (error) {
        console.error("Error al cargar técnicos:", error);
        mostrarError("No se pudieron cargar los técnicos disponibles.");
    }
}

btnAbrirReasignacion?.addEventListener("click", async () => {
    document.querySelectorAll("#frmReasignacion .dialog-campo").forEach((campo) => {
        campo.classList.remove("is-invalid");
    });

    sltPrioridadEdicion.value = ticketActual.prioridad ?? "";
    dtFechaVencimientoEdicion.value = formatearParaDateTimeLocal(ticketActual.fechaVencimiento);

    await cargarTecnicosEdicion();
    if (ticketActual.tecnicoAsignado) {
        sltTecnicoEdicion.value = ticketActual.tecnicoAsignado;
    }

    dialogReasignacion.showModal();
});

//Mapea los nombres de los campos ya que los id son distintos a os que retorna el validator
const mapeoCamposReasignacion = {
    sltPrioridad: "campoPrioridad",
    sltTecnico: "campoTecnico",
    dtFechaVencimiento: "campoFechaVencimiento"
};

frmReasignacion?.addEventListener("submit", async (e) => {
    e.preventDefault();

    document.querySelectorAll("#frmReasignacion .dialog-campo").forEach((campo) => {
        campo.classList.remove("is-invalid");
    });

    const datos = {
        prioridad: sltPrioridadEdicion.value,
        tecnicoAsignado: sltTecnicoEdicion.value,
        fechaVencimiento: dtFechaVencimientoEdicion.value
    };

    const errores = validarFormularioAprobacion(datos);
    if (errores.length > 0) {
        errores.forEach((error) => {
            const campo = document.getElementById(mapeoCamposReasignacion[error.campo]);
            if (campo) {
                campo.classList.add("is-invalid");
                campo.querySelector(".dialog-error").textContent = error.mensaje;
            }
        });
        return;
    }

    //Cierra el dialog antes de confirmar para no tapar la alerta
    dialogReasignacion.close();
    const confirmar = await mostrarConfirmacion("¿Deseas reasignar este ticket?", "El ticket volverá al estado 'Asignado'", "Reasignar");
    if (!confirmar) {
        dialogReasignacion.showModal(); //Reabrir con los datos que ya tenía
        return;
    }

    try {
        await editarComoGestor(idTicketActual, {
            fechaVencimiento: datos.fechaVencimiento,
            tecnicoAsignado: Number(datos.tecnicoAsignado),
            prioridad: datos.prioridad
        }, idUsuario);

        mostrarExitoSimple("¡Ticket reasignado!", "Los cambios se guardaron correctamente.");
        await cargarTicket();
        await cargarBitacoras();
    } catch (error) {
        console.error("Error al reasignar el ticket:", error);
        mostrarError("No se pudo reasignar el ticket.").then(() => dialogReasignacion.showModal());
    }
});

//Cargar y mostrar bitácoras
async function cargarBitacoras() {
    try {
        const bitacoras = await getBitacorasPorTicket(idTicketActual);

        tablaBitacora.innerHTML = "";

        bitacoras.forEach((bitacora) => {
            tablaBitacora.innerHTML += `
            <tr>
                <td class="fw-bold text-muted">${bitacora.nombreUsuario}</td>
                <td class="text-muted">${bitacora.nuevoEstado}</td>
                <td class="text-muted">${formatearFecha12H(bitacora.fechaHora)}</td>
            </tr>
            `
        });
    } catch (error) {
        console.error("Error al cargar la tabla de bitácoras:", error);
        mostrarError("Oops... No se pudo cargar la bitácora");
    }
}

//Función para abrir la vista previa de una imagen (evidencias y adjuntos de comentarios)
window.abrirVistaImagen = function (url) {
    imgVistaPrevia.src = url;
    dialogVistaPrevia.showModal();
};

//Comentarios
function renderizarComentarios() {
    if (comentariosActuales.length === 0) {
        listaComentarios.innerHTML = `<p class="text-muted small mb-0">Aún no hay comentarios. ¡Sé el primero en escribir uno!</p>`;
        return;
    }

    listaComentarios.innerHTML = comentariosActuales.map((comentario) => {
        const esPropio = Number(comentario.idUsuarioComentario) === idUsuario;
        const tipo = esPropio ? "propio" : "otro";

        const correo = !esPropio ? `<span class="correo-comentario">${escapeHTML(comentario.correoUsuario ?? "")}</span>` : "";
        const galeria = (comentario.multimediaUrls && comentario.multimediaUrls.length > 0)
            ? `<div class="galeria-burbuja-comentario">${comentario.multimediaUrls.map((url) => `<img src="${url}" alt="Imagen adjunta" onclick="abrirVistaImagen('${url}')">`).join("")}</div>`
            : "";

        const btnEliminar = esPropio ? `
            <button type="button" class="btn-eliminar-comentario" data-id-comentario="${comentario.id}" aria-label="Eliminar comentario" title="Eliminar comentario">
                <i class="bi bi-trash3"></i>
            </button>` : "";

        return `
            <div class="burbuja-comentario-wrapper ${tipo}">
                ${correo}
                <div class="burbuja-comentario ${tipo}">
                    <span class="text-break">${escapeHTML(comentario.comentario)}</span>
                    ${galeria}
                </div>
                <div class="pie-comentario">
                    <span class="hora-comentario">${formatearFecha12H(comentario.fechaHora)}</span>
                    ${btnEliminar}
                </div>
            </div>
        `;
    }).join("");

    listaComentarios.scrollTop = listaComentarios.scrollHeight;
}

//Para eliinar comentarios
listaComentarios?.addEventListener("click", async (e) => {
    const btnEliminar = e.target.closest(".btn-eliminar-comentario");
    if (!btnEliminar) return;

    const idComentario = Number(btnEliminar.dataset.idComentario);

    const confirmar = await mostrarConfirmacion("¿Deseas eliminar este comentario?", "Esta acción no se puede revertir", "Eliminar");
    if (!confirmar) return;

    try {
        await eliminarComentario(idComentario);
        comentariosActuales = comentariosActuales.filter((c) => c.id !== idComentario);
        renderizarComentarios();
    } catch (error) {
        console.error("Error al eliminar el comentario:", error);
        mostrarError("No se pudo eliminar el comentario.");
    }
});

//Para mostrar la ultimedia del comentario
function renderizarGaleriaComentario() {
    if (archivosComentarioSeleccionados.length === 0) {
        galeriaComentarioAdjuntos.classList.add("d-none");
        galeriaComentarioAdjuntos.innerHTML = "";
        return;
    }

    galeriaComentarioAdjuntos.classList.remove("d-none");
    galeriaComentarioAdjuntos.innerHTML = "";

    archivosComentarioSeleccionados.forEach((archivo, index) => {
        const lector = new FileReader();
        lector.onload = function (e) {
            const miniatura = document.createElement("div");
            miniatura.className = "miniatura-foto";
            miniatura.innerHTML = `
                <img src="${e.target.result}" alt="Adjunto ${index + 1}">
                <button type="button" class="btn-eliminar-foto" data-index="${index}" aria-label="Eliminar adjunto">
                    <i class="bi bi-x"></i>
                </button>
            `;
            galeriaComentarioAdjuntos.appendChild(miniatura);
        };
        lector.readAsDataURL(archivo);
    });
}

btnAdjuntarComentario?.addEventListener("click", () => inputComentarioMultimedia.click());

//Valida que la multimedia no sobrepase el limite
inputComentarioMultimedia?.addEventListener("change", function () {
    let combinados = archivosComentarioSeleccionados.concat(Array.from(this.files));

    if (combinados.length > limiteMultimediaComentario) {
        combinados = combinados.slice(0, limiteMultimediaComentario);
        mostrarError(`Solo puedes adjuntar un máximo de ${limiteMultimediaComentario} imágenes por comentario.`);
    }

    archivosComentarioSeleccionados = combinados;
    renderizarGaleriaComentario();
    this.value = "";
});

//Para eliminar multimedia seleccionada
galeriaComentarioAdjuntos?.addEventListener("click", (e) => {
    const btnEliminar = e.target.closest(".btn-eliminar-foto");
    if (btnEliminar) {
        archivosComentarioSeleccionados.splice(Number(btnEliminar.dataset.index), 1);
        renderizarGaleriaComentario();
    }
});

//El textarea del comentario crece junto con el texto
txtComentario?.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
});

frmComentario?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const comentario = txtComentario.value.trim();

    const errores = validarFormularioComentario(comentario);
    if (errores.length > 0) {
        mostrarError(errores.map((error) => error.mensaje).join(" "));
        return;
    }

    btnEnviarComentario.disabled = true;

    try {
        const comentarioCreado = await crearComentario({
            comentario: comentario,
            idTicket: idTicketActual,
            idUsuarioComentario: idUsuario
        });

        if (archivosComentarioSeleccionados.length > 0) {
            const subidas = archivosComentarioSeleccionados.map((archivo) =>
                subirMultimediaComentario(archivo, comentarioCreado.id)
            );
            await Promise.all(subidas);
        }

        txtComentario.value = "";
        txtComentario.style.height = "auto";
        archivosComentarioSeleccionados = [];
        renderizarGaleriaComentario();

        comentariosActuales = await obtenerComentariosPorTicket(idTicketActual);
        renderizarComentarios();
    } catch (error) {
        console.error("Error al enviar el comentario:", error);
        mostrarError("No se pudo enviar el comentario.");
    } finally {
        btnEnviarComentario.disabled = false;
    }
});