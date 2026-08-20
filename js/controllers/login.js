import { login } from "../services/authService.js";
import { mostrarError } from "../components/sweetAlerts.js";

// Mismas reglas de validación que en iTicket_Web/js/components/frmValidaciones.js
function esCorreoValido(correo) {
    const texto = correo.trim();
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return texto.length > 0 && texto.length <= 50 && patron.test(texto);
}

function esContrasenaValida(contrasena) {
    return contrasena.trim().length >= 6 && contrasena.trim().length <= 18;
}

document.addEventListener("DOMContentLoaded", () => {
    const splash = document.querySelector(".splash-screen");

    document.body.classList.add("splash-active");

    setTimeout(() => {
        document.body.classList.remove("splash-active");
        if (splash) {
            splash.style.display = "none";
        }
    }, 4000);
});

const passwordInput = document.getElementById("password");
const passwordButton = document.querySelector(".password-icon");

if (passwordButton && passwordInput) {
    passwordButton.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
    });
}

// Esto hace que al estar en recuperar contraseña vaya recuadro por recuadro al digitar un numero 
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.code-input');

    inputs.forEach((input, index) => {
        // Pasar al siguiente input al escribir
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        // Retroceder al borrar
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form');
    const botonIniciarSesion = document.querySelector('.button-iniciar');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('email').value;
            const contrasena = document.getElementById('password').value;

            if (!esCorreoValido(correo)) {
                mostrarError("Ingresa un correo electrónico válido.");
                return;
            }

            if (!esContrasenaValida(contrasena)) {
                mostrarError("Contraseña inválida. Debe tener entre 6 y 18 caracteres.");
                return;
            }

            if (botonIniciarSesion) botonIniciarSesion.disabled = true;

            try {
                const usuario = await login(correo, contrasena);

                if (!usuario) {
                    mostrarError("Correo o contraseña incorrectos.");
                    if (botonIniciarSesion) botonIniciarSesion.disabled = false;
                    return;
                }

                sessionStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
                window.location.href = 'pantallaCarga.html';
            } catch (error) {
                mostrarError("No se pudo conectar con el servidor. Intenta de nuevo.");
                if (botonIniciarSesion) botonIniciarSesion.disabled = false;
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-correo');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();


            window.location.href = 'loginCodigo.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-contraseña');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();


            window.location.href = 'loginContraseña.html';
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.google-button');

    if (button) {
        button.addEventListener('click', (e) => {
            window.location.href = 'loginGoogle.html';
        });
    }
});