const NOTYF_SCRIPT = 'js/components/notyf.min.js';
const NOTYF_STYLES = 'css/notyf.min.css';

let notyfPromise;
let instanciaNotyf;
let estilosNotyfPromise;

function textoAlerta(titulo, mensaje, extra = '') {
    return [titulo, mensaje, extra].filter(Boolean).join(' — ');
}

function convertirMensajeTecnico(mensaje) {
    const texto = String(mensaje ?? '').trim();

    if (!texto || /^\[object Object\]$/i.test(texto)) {
        return 'No se pudo completar la operación. Intenta nuevamente.';
    }

    if (/restricci[oó]n [uú]nica|llave [uú]nica|clave (?:duplicada|[uú]nica)|unique constraint|duplicate key|ora-00001|sqlstate\s*23505/i.test(texto)) {
        return 'Ese dato ya está registrado.';
    }

    if (/ora-02292|integrity constraint.*child record|child record found|llave for[aá]nea dependiente|foreign key constraint.*(?:delete|update)|est[aá] siendo (?:usado|utilizado)/i.test(texto)) {
        return 'No se puede eliminar porque este registro está siendo utilizado en otra parte del sistema.';
    }

    if (/ora-02291|parent key not found|foreign key|llave for[aá]nea|sqlstate\s*23503/i.test(texto)) {
        return 'Uno de los datos seleccionados ya no existe. Actualiza la página y vuelve a intentarlo.';
    }

    if (/ora-01400|ora-01407|cannot insert null|not-null property|null value in column|sqlstate\s*23502/i.test(texto)) {
        return 'Falta completar un campo obligatorio.';
    }

    if (/ora-02290|check constraint|sqlstate\s*23514/i.test(texto)) {
        return 'Uno de los datos ingresados no tiene un valor permitido.';
    }

    if (/\b401\b|unauthorized|no autorizado|token (?:inv[aá]lido|expirado)|jwt expired/i.test(texto)) {
        return 'Tu sesión ya no es válida. Inicia sesión nuevamente.';
    }

    if (/\b403\b|forbidden|acceso denegado|sin permisos/i.test(texto)) {
        return 'No tienes permiso para realizar esta acción.';
    }

    if (/failed to fetch|fetch failed|networkerror|network request failed|load failed|err_connection|connection refused|servidor no disponible/i.test(texto)) {
        return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo nuevamente.';
    }

    if (/timeout|timed out|aborterror|tiempo de espera/i.test(texto)) {
        return 'El servidor tardó demasiado en responder. Inténtalo nuevamente.';
    }

    if (/internal server error|\b500\b|ora-\d+|sqlstate|sqlexception|jdbc|hibernate|stack trace|java\.[a-z]|org\.springframework|constraint violation/i.test(texto)) {
        return 'No se pudo completar la operación. Revisa los datos e inténtalo nuevamente.';
    }

    return texto;
}

function escaparHTML(valor) {
    return String(valor)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function asegurarEstilos() {
    if (estilosNotyfPromise) return estilosNotyfPromise;

    estilosNotyfPromise = new Promise((resolve, reject) => {
        const existente = document.querySelector('link[data-iticket-notyf]');
        const link = existente || document.createElement('link');
        const temporizador = window.setTimeout(() => reject(new Error('Tiempo de carga de estilos de Notyf agotado')), 4500);
        const resolver = () => {
            window.clearTimeout(temporizador);
            resolve();
        };
        const rechazar = (error) => {
            window.clearTimeout(temporizador);
            reject(error);
        };

        if (existente?.sheet) {
            resolver();
            return;
        }

        link.addEventListener('load', resolver, { once: true });
        link.addEventListener('error', rechazar, { once: true });
        if (!existente) {
            link.rel = 'stylesheet';
            link.href = NOTYF_STYLES;
            link.dataset.iticketNotyf = 'true';
            document.head.appendChild(link);
        }
    });

    return estilosNotyfPromise;
}

function crearInstancia() {
    if (instanciaNotyf) return instanciaNotyf;
    instanciaNotyf = new window.Notyf({
        duration: 5000,
        dismissible: true,
        ripple: true,
        position: { x: 'center', y: 'top' },
        types: [
            { type: 'warning', background: '#d58b22', icon: false, duration: 5000, dismissible: true },
            { type: 'info', background: '#247eb7', icon: false, duration: 5000, dismissible: true }
        ]
    });
    return instanciaNotyf;
}

function obtenerNotyf() {
    const estilosListos = asegurarEstilos();
    if (window.Notyf) return estilosListos.then(() => crearInstancia());
    if (notyfPromise) return notyfPromise;

    const scriptListo = new Promise((resolve, reject) => {
        const existente = document.querySelector('script[data-iticket-notyf]');
        const script = existente || document.createElement('script');
        const temporizador = window.setTimeout(() => reject(new Error('Tiempo de carga de Notyf agotado')), 4500);
        const resolver = () => {
            window.clearTimeout(temporizador);
            resolve();
        };
        const rechazar = (error) => {
            window.clearTimeout(temporizador);
            reject(error);
        };
        script.addEventListener('load', resolver, { once: true });
        script.addEventListener('error', rechazar, { once: true });
        if (!existente) {
            script.src = NOTYF_SCRIPT;
            script.dataset.iticketNotyf = 'true';
            document.head.appendChild(script);
        }
    });

    notyfPromise = Promise.all([estilosListos, scriptListo]).then(() => crearInstancia());

    return notyfPromise;
}

function toastFallback(tipo, mensaje, duracion) {
    let region = document.querySelector('.iticket-toast-region');
    if (!region) {
        region = document.createElement('div');
        region.className = 'iticket-toast-region';
        region.setAttribute('aria-live', tipo === 'error' ? 'assertive' : 'polite');
        document.body.appendChild(region);
    }
    const toast = document.createElement('div');
    toast.className = `iticket-toast-fallback ${tipo}`;
    toast.textContent = mensaje;
    region.appendChild(toast);
    window.setTimeout(() => {
        toast.classList.add('saliendo');
        window.setTimeout(() => toast.remove(), 210);
    }, Math.max(400, duracion - 200));
}

async function mostrarToast(tipo, mensaje, duracion = 5000) {
    try {
        const notyf = await obtenerNotyf();
        const mensajeSeguro = escaparHTML(mensaje);
        if (tipo === 'success') return notyf.success({ message: mensajeSeguro, duration: duracion });
        if (tipo === 'error') return notyf.error({ message: mensajeSeguro, duration: duracion });
        return notyf.open({ type: tipo, message: mensajeSeguro, duration: duracion });
    } catch (error) {
        console.warn('Notyf no se pudo cargar; se usará la notificación local.', error);
        toastFallback(tipo, mensaje, duracion);
        return null;
    }
}

export async function mostrarExitoRedireccion(titulo, mensaje, urlDestino) {
    await mostrarToast('success', textoAlerta(titulo, mensaje), 2200);
    window.setTimeout(() => { window.location.href = urlDestino; }, 1200);
}

export function mostrarExitoSimple(titulo, mensaje) {
    return mostrarToast('success', textoAlerta(titulo, mensaje));
}

export function mostrarError(mensaje, pieDePagina = false) {
    const mensajeAmigable = convertirMensajeTecnico(mensaje);
    return mostrarToast('error', textoAlerta('No pudimos completar la acción', mensajeAmigable, pieDePagina || ''));
}

export function mostrarAlertaEspera(tiempoRestante, titulo = 'Espera un momento', mensaje = 'Aún debes esperar antes de solicitar otro código.') {
    return mostrarToast('warning', textoAlerta(titulo, mensaje), 5000);
}

export function mostrarConfirmacion(titulo, mensaje, textoBotonConfirmar = 'Sí, continuar', textoBotonCancelar = 'Cancelar') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'iticket-confirmacion';
        overlay.innerHTML = '<button type="button" class="iticket-confirmacion-fondo" aria-label="Cancelar"></button><section class="iticket-confirmacion-panel" role="alertdialog" aria-modal="true"><span class="iticket-confirmacion-handle" aria-hidden="true"></span><div class="iticket-confirmacion-icono" aria-hidden="true">!</div><h2></h2><p></p><div class="iticket-confirmacion-acciones"><button type="button" class="iticket-confirmacion-cancelar"></button><button type="button" class="iticket-confirmacion-aceptar"></button></div></section>';

        overlay.querySelector('h2').textContent = titulo || '¿Estás seguro?';
        overlay.querySelector('p').textContent = mensaje || '';
        overlay.querySelector('.iticket-confirmacion-cancelar').textContent = textoBotonCancelar;
        overlay.querySelector('.iticket-confirmacion-aceptar').textContent = textoBotonConfirmar;
        document.body.appendChild(overlay);

        const terminar = (resultado) => {
            overlay.classList.remove('visible');
            window.setTimeout(() => overlay.remove(), 220);
            document.removeEventListener('keydown', manejarTeclado);
            resolve(resultado);
        };
        const manejarTeclado = (event) => {
            if (event.key === 'Escape') terminar(false);
        };

        overlay.querySelector('.iticket-confirmacion-fondo').addEventListener('click', () => terminar(false));
        overlay.querySelector('.iticket-confirmacion-cancelar').addEventListener('click', () => terminar(false));
        overlay.querySelector('.iticket-confirmacion-aceptar').addEventListener('click', () => terminar(true));
        document.addEventListener('keydown', manejarTeclado);
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            overlay.querySelector('.iticket-confirmacion-aceptar').focus();
        });
    });
}
