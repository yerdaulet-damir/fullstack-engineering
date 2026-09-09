const form = document.querySelector('#signup-form');
const emailInput = document.querySelector('#email');
const message = document.querySelector('#form-message');
const year = document.querySelector('#year');

year.textContent = String(new Date().getFullYear());

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();

  // TODO: strengthen validation so addresses such as "person@example" fail.
  if (!email.includes('@')) {
    message.dataset.state = 'error';
    message.textContent = 'Enter a valid work email.';
    emailInput.focus();
    return;
  }

  // TODO: store the accepted address in sessionStorage and reject duplicates.
  message.dataset.state = 'success';
  message.textContent = `Thanks — ${email} is on the preview list.`;
  form.reset();
});

// TODO: add optional enhanced FAQ behavior without breaking native <details>.
