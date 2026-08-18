document.addEventListener('DOMContentLoaded', () => {
  const stack = document.getElementById('ticketsStack');
  if (!stack) return;

  const cards = stack.querySelectorAll('.ticket-card');

  const resetStack = () => {
    cards.forEach(c => c.classList.remove('is-active'));
    stack.className = 'tickets-stack';
  };

  cards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('chat-icon')) {
        e.stopPropagation();
        const url = card.getAttribute('data-url');
        if (url) window.location.href = url;
        return;
      }

      const isActive = card.classList.contains('is-active');

      if (isActive) {
        const url = card.getAttribute('data-url');
        if (url) window.location.href = url;
        return;
      }

      resetStack();
      
      card.classList.add('is-active');
      stack.classList.add('has-active', `active-${index}`);

      const height = card.scrollHeight + 20;
      stack.style.setProperty('--open-height', `${height}px`);
    });
  });

  // Retraer los tickets al hacer click afuera
  document.addEventListener('click', (e) => {
    if (!stack.contains(e.target)) {
      resetStack();
    }
  });
});