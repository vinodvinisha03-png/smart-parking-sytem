const form = document.getElementById('loginForm');
const errorEl = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(errorEl);

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    saveSession(data.token, data.user);
    window.location.href = data.user.role === 'admin' ? 'admin.html' : 'locations.html';
  } catch (err) {
    showError(errorEl, err.message);
  }
});
