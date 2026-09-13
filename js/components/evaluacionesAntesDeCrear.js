    // Se confirma si hay evaluaciones pendientes antes de crear un ticket. Si las hay, se redirige a la página de evaluaciones pendientes. Si no, se puede crear el ticket
import { getTicketsPendientesEvaluacion } from "../services/ticketsService.js";
import { mostrarAvisoRedireccion, mostrarConfirmacion, mostrarError } from "./notificacionesUI.js";

let comprobando = false;

export async function permitirCrearTicket(idUsuario) {
    if (comprobando) return false;
    comprobando = true;
    try {
        const resultado = await getTicketsPendientesEvaluacion(idUsuario);
        if (!Array.isArray(resultado?.tickets)) throw new Error("Respuesta de evaluaciones inválida");
        if (resultado.tickets.length === 0 && !(Number(resultado.totalElementos) > 0)) return true;

        const resolver = await mostrarConfirmacion(
            "Tienes evaluaciones pendientes",
            "Resuelve tus evaluaciones pendientes antes de crear un nuevo ticket.",
            "Resolver",
            "Cancelar ticket",
        );
        if (resolver) {
            const paginaActual = `${window.location.pathname.split("/").pop() || "crearTickets.html"}${window.location.search}`;
            const parametros = new URLSearchParams({ volver: paginaActual });
            window.location.href = `evaluacionPendiente.html?${parametros}`;
        } else {
            sessionStorage.removeItem("iticket_borrador_creacion");
            await mostrarAvisoRedireccion(
                "Ticket no creado",
                "Cancelaste la creación porque aún tienes evaluaciones pendientes.",
                "misTickets.html"
            );
        }
        return false;
    } catch {
        mostrarError("No se pudieron comprobar tus evaluaciones pendientes. Intenta crear el ticket nuevamente.");
        return false;
    } finally {
        comprobando = false;
    }
}
