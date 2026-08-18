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

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            window.location.href = 'pantallaCarga.html';
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