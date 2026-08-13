const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', function (e) {
        e.preventDefault(); // Evita el salto de página al hacer clic

        // 1. Quitar estado activo a todos los ítems y restaurar su imagen normal
        navItems.forEach(nav => {
            nav.classList.remove('active');
            const img = nav.querySelector('img');
            if (img) {
                img.src = img.getAttribute('data-normal');
            }
        });

        // 2. Activar el ítem seleccionado y cambiar su imagen a la versión activa
        this.classList.add('active');
        const activeImg = this.querySelector('img');
        if (activeImg) {
            activeImg.src = activeImg.getAttribute('data-active');
        }
    });
});