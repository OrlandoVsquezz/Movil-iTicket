// Validaciones para el formulario de agregar un nuevo detalle de fase
export function validarFormularioDetalleFase(data = {}) {
    const errores = [];
    const descripcion = data.descripcionDetalle ?? data.descripcion ?? '';

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
        errores.push('La descripción del detalle de la fase es obligatoria.');
    } else if (descripcion.trim().length > 200) {
        errores.push('La descripción del detalle de la fase no puede superar los 200 caracteres.');
    }

    const idFase = Number(data.idFase ?? data.fase);
    if (!Number.isInteger(idFase) || idFase <= 0) {
        errores.push('Debes seleccionar una fase válida.');
    }

    return errores;
}