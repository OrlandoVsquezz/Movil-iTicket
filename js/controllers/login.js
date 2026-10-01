import { login, solicitarRecuperacion, validarCodigo, restablecerContrasena, reenviarCodigo } from "../services/authService.js";
import { getUsuarioId } from "../services/usuariosService.js";
import { mostrarError, mostrarExitoRedireccion, mostrarExitoSimple } from "../components/notificacionesUI.js";

// Mismas reglas de validaciï¿½n que en iTicket_Web
function esCorreoValido(correo) {
    const texto = correo.trim();
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return texto.length > 0 && texto.length <= 50 && patron.test(texto);
}

function esContrasenaValida(contrasena) {
    return contrasena.trim().length >= 6 && contrasena.trim().length <= 18;
}

// Lï¿½gica del Splash Screen
document.addEventListener("DOMContentLoaded", () => {
    const splash = document.querySelector(".splash-screen");
    document.body.classList.add("splash-active");
    setTimeout(() => {
        document.body.classList.remove("splash-active");
        if (splash) splash.style.display = "none";
    }, 4000);
});

// Lï¿½gica del Ojo de Contraseï¿½a (Aplica a todos los inputs de tipo password)
document.addEventListener('DOMContentLoaded', () => {
    const passwordContainers = document.querySelectorAll('.password-container');
    passwordContainers.forEach(container => {
        const input = container.querySelector('input');
        const button = container.querySelector('.password-icon');
        if (input && button) {
            button.innerHTML = ` 
                <svg class="password-eye password-eye-open" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
                    <circle cx="12" cy="12" r="2.6"></circle>
                </svg>
                <svg class="password-eye password-eye-closed" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m3 3 18 18M10.6 6.1A8.8 8.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.3 3M6.1 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
                </svg>`;
            button.setAttribute("aria-pressed", "false");

            button.addEventListener("click", () => {
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                button.setAttribute("aria-pressed", String(isPassword));
                button.setAttribute("aria-label", isPassword ? "Ocultar contraseï¿½a" : "Mostrar contraseï¿½a");
            });
        }
    });
});

// 1. Lï¿½gica del LOGIN PRINCIPAL
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.querySelector('#form-login');
    const botonIniciarSesion = document.querySelector('.button-iniciar');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('email').value;
            const contrasena = document.getElementById('password').value;

            if (!esCorreoValido(correo)) {
                mostrarError("Ingresa un correo electrï¿½nico vï¿½lido.");
                return;
            }

            if (!esContrasenaValida(contrasena)) {
                mostrarError("Contraseï¿½a invï¿½lida. Debe tener entre 6 y 18 caracteres.");
                return;
            }

            if (botonIniciarSesion) botonIniciarSesion.disabled = true;

            try {
                const usuario = await login(correo, contrasena);
                const detalle = await getUsuarioId(usuario.idUsuario).catch(() => null);
                sessionStorage.setItem('usuarioLogueado', JSON.stringify({ ...usuario, ...(detalle || {}) }));
                mostrarExitoRedireccion('Sesiï¿½n iniciada', 'Bienvenido.', 'pantallaCarga.html');
            } catch (error) {
                const sinConexion = error instanceof TypeError;
                mostrarError(sinConexion ? "No se pudo conectar con el servidor. Intenta de nuevo." : error.message);
                if (botonIniciarSesion) botonIniciarSesion.disabled = false;
            }
        });
    }
});

// 2. Lï¿½gica de RECUPERAR CONTRASEï¿½A (Pedir Correo)
document.addEventListener('DOMContentLoaded', () => {
    const formRecuperar = document.querySelector('#form-recuperar');
    if (formRecuperar) {
        formRecuperar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const correo = document.getElementById('email').value;
            
            if (!esCorreoValido(correo)) {
                mostrarError("Ingresa un correo electrï¿½nico vï¿½lido.");
                return;
            }

                        const boton = formRecuperar.querySelector('button');
            boton.disabled = true;
            boton.innerHTML = 'Enviando...';
            try {
                await solicitarRecuperacion(correo);
                mostrarExitoRedireccion("Codigo Enviado", "Revisa tu bandeja de entrada o spam.", "loginCodigo.html");
            } catch (error) {
                mostrarError(error.message);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Enviar codigo';
            }
        });
    }
});

// 3. Lï¿½gica de VALIDAR CODIGO DE 6 DIGITOS
document.addEventListener('DOMContentLoaded', () => {
    const formCodigo = document.querySelector('#form-codigo');
    const inputs = document.querySelectorAll('.code-input');

    if (formCodigo) {
        // Bloqueo si entra directo sin correo
        if (false) {
            window.location.replace("login.html");
            return;
        }

        // Navegacion entre inputs
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
                        input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const textoPegado = (e.clipboardData || window.clipboardData).getData('text').replace(/\s/g, '').slice(0, inputs.length);
                textoPegado.split('').forEach((caracter, i) => {
                    if (inputs[index + i]) inputs[index + i].value = caracter;
                });
                const ultimoLleno = Math.min(index + textoPegado.length - 1, inputs.length - 1);
                inputs[ultimoLleno].focus();
            });
        });

                const linkReenviarMovil = document.querySelector('#linkReenviarMovil');
        if (linkReenviarMovil) {
            let enEspera = false;
            let tiempoInicio = 0;
            
            linkReenviarMovil.addEventListener('click', async (e) => {
                e.preventDefault();
                if (enEspera) {
                    let tiempoRestante = 35 - Math.floor((Date.now() - tiempoInicio)/1000);
                    mostrarError('Espera ' + tiempoRestante + ' segundos para reenviar');
                    return;
                }
                
                enEspera = true;
                tiempoInicio = Date.now();
                linkReenviarMovil.style.color = '#ccc';
                
                try {
                    await reenviarCodigo();
                    mostrarExitoSimple("Código Enviado", "Revisa tu bandeja de entrada o spam");
                } catch(error) {
                    mostrarError(error.message || "Error al reenviar");
                }
                
                setTimeout(() => {
                    enEspera = false;
                    linkReenviarMovil.style.color = '#007bff';
                }, 35000);
            });
        }
        
        formCodigo.addEventListener('submit', async (e) => {
            e.preventDefault();
            const codigoCompleto = Array.from(inputs).map(i => i.value).join('');
            if(codigoCompleto.length < 6) {
                mostrarError("Ingresa los 6 dï¿½gitos completos");
                return;
            }

                        const boton = formCodigo.querySelector('button');
            boton.disabled = true;
            boton.innerHTML = 'Validando...';
            try {
                await validarCodigo(codigoCompleto);
                mostrarExitoRedireccion("Codigo Correcto", "Ya puedes establecer tu nueva contrasena.", "loginContrasena.html");
            } catch (error) {
                mostrarError(error.message);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Validar codigo';
            }
        });
    }
});

// 4. Lï¿½gica de NUEVA CONTRASEï¿½A
document.addEventListener('DOMContentLoaded', () => {
    const formNueva = document.querySelector('#form-nueva-contrasena');
    if (formNueva) {
        if (false) {
            window.location.replace("login.html");
            return;
        }

        formNueva.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nueva = document.getElementById('passwordNueva').value;
            const confirmar = document.getElementById('passwordConfirmar').value;

            if (!esContrasenaValida(nueva)) {
                mostrarError("Contraseï¿½a invï¿½lida. Debe tener entre 6 y 18 caracteres.");
                return;
            }
            if (nueva !== confirmar) {
                mostrarError("Las contraseï¿½as no coinciden.");
                return;
            }

                        const boton = formNueva.querySelector('button');
            boton.disabled = true;
            boton.innerHTML = 'Guardando...';
            try {
                await restablecerContrasena(nueva);
                mostrarExitoRedireccion("Contrasena Restablecida", "Tu contrasena ha sido actualizada correctamente.", "login.html");
            } catch (error) {
                mostrarError(error.message);
            } finally {
                boton.disabled = false;
                boton.innerHTML = 'Restablecer contrasena';
            }
        });
    }
});

// Lï¿½gica Login Google
document.addEventListener('DOMContentLoaded', () => {
    const buttonGoogle = document.querySelector('.google-button');
    if (buttonGoogle) {
        buttonGoogle.addEventListener('click', (e) => {
            window.location.href = 'loginGoogle.html';
        });
    }
});






