const API_URL = "http://localhost:8080/api/evaluaciones";

// Registra la valoración de un ticket resuelto. La API cierra el ticket al guardar.
export async function crearEvaluacion(evaluacion) {
    try {
        const respuesta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(evaluacion)
        });

        const cuerpo = await respuesta.json().catch(() => null);
        if (!respuesta.ok) {
            throw new Error(
                cuerpo?.mensaje
                || cuerpo?.message
                || cuerpo?.errores?.[0]
                || "No se pudo registrar la evaluación."
            );
        }

        return cuerpo?.data;
    } catch (error) {
        console.error("Error al registrar la evaluación:", error);
        throw error;
    }
}
