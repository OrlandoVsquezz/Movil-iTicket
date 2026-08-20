// Este js solo se encarga de en la parte de las estrellas, rellenar de forma dinamica la estrella de amarillo

const contenedorEstrellas = document.getElementById("estrellasCalificacion");
const opcionesCalificacion = Array.from(
    contenedorEstrellas.querySelectorAll('input[name="calificacion"]')
);
const resultadoCalificacion = document.getElementById("resultadoCalificacion");

let calificacionSeleccionada = 0;

async function crearEstrellaRellena(rutaImagen) {
    const imagenOriginal = new Image();
    imagenOriginal.src = rutaImagen;

    await new Promise(function (resolver, rechazar) {
        imagenOriginal.addEventListener("load", resolver, { once: true });
        imagenOriginal.addEventListener("error", rechazar, { once: true });
    });

    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = imagenOriginal.naturalWidth;
    canvas.height = imagenOriginal.naturalHeight;
    contexto.drawImage(imagenOriginal, 0, 0);

    const imagen = contexto.getImageData(0, 0, canvas.width, canvas.height);
    const pixeles = imagen.data;
    const total = canvas.width * canvas.height;
    const exterior = new Uint8Array(total);
    const cola = new Int32Array(total);
    let inicioCola = 0;
    let finalCola = 0;

    function agregarPixel(x, y) {
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
        const indice = y * canvas.width + x;
        const alfa = pixeles[indice * 4 + 3];
        if (exterior[indice] || alfa > 8) return;
        exterior[indice] = 1;
        cola[finalCola++] = indice;
    }

    for (let x = 0; x < canvas.width; x++) {
        agregarPixel(x, 0);
        agregarPixel(x, canvas.height - 1);
    }
    for (let y = 0; y < canvas.height; y++) {
        agregarPixel(0, y);
        agregarPixel(canvas.width - 1, y);
    }

    while (inicioCola < finalCola) {
        const indice = cola[inicioCola++];
        const x = indice % canvas.width;
        const y = Math.floor(indice / canvas.width);
        agregarPixel(x + 1, y);
        agregarPixel(x - 1, y);
        agregarPixel(x, y + 1);
        agregarPixel(x, y - 1);
    }

    for (let indice = 0; indice < total; indice++) {
        const posicion = indice * 4;
        const alfaOriginal = pixeles[posicion + 3];
        const perteneceAlContorno = alfaOriginal > 8;
        const perteneceAlInterior = !exterior[indice] && !perteneceAlContorno;

        if (perteneceAlContorno || perteneceAlInterior) {
            pixeles[posicion] = 245;
            pixeles[posicion + 1] = 197;
            pixeles[posicion + 2] = 24;
            pixeles[posicion + 3] = perteneceAlInterior ? 255 : alfaOriginal;
        } else {
            pixeles[posicion + 3] = 0;
        }
    }

    contexto.putImageData(imagen, 0, 0);
    return canvas.toDataURL("image/png");
}


async function prepararImagenSeleccionada() {
    const imagenNormal = contenedorEstrellas.dataset.imagen;
    if (!imagenNormal || contenedorEstrellas.dataset.imagenSeleccionada) return;

    try {
        contenedorEstrellas.dataset.imagenSeleccionada = await crearEstrellaRellena(imagenNormal);
        pintarEstrellas(calificacionSeleccionada);
    } catch {
    }
}

function pintarEstrellas(valor, animar = false) {
    opcionesCalificacion.forEach(function (opcion) {
        const estrella = opcion.closest(".estrella");
        const imagen = estrella.querySelector(".imagen-estrella");
        const seleccionada = Number(opcion.value) <= valor;
        const imagenNormal = contenedorEstrellas.dataset.imagen;
        const imagenSeleccionada = contenedorEstrellas.dataset.imagenSeleccionada || imagenNormal;

        estrella.classList.toggle("seleccionada", seleccionada);
        estrella.classList.remove("animando");

        if (animar && seleccionada) {
            void estrella.offsetWidth;
            estrella.classList.add("animando");
        }

        if (imagenNormal) {
            imagen.src = seleccionada ? imagenSeleccionada : imagenNormal;
        }
    });
}

opcionesCalificacion.forEach(function (opcion) {
    opcion.addEventListener("change", function () {
        calificacionSeleccionada = Number(opcion.value);
        pintarEstrellas(calificacionSeleccionada, true);
        resultadoCalificacion.value = `${calificacionSeleccionada} de 5 estrellas`;
    });

    opcion.closest(".estrella").addEventListener("pointerenter", function (evento) {
        if (evento.pointerType !== "touch") pintarEstrellas(Number(opcion.value));
    });
});

contenedorEstrellas.addEventListener("pointerleave", function () {
    pintarEstrellas(calificacionSeleccionada);
});

pintarEstrellas(0);
prepararImagenSeleccionada();
