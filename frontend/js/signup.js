const form = document.getElementById('signupForm');
const errorEl = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(errorEl);

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const adminCode = document.getElementById('adminCode').value.trim();

  try {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: { name, email, password, adminCode: adminCode || undefined }
    });
    saveSession(data.token, data.user);
    window.location.href = data.user.role === 'admin' ? 'admin.html' : 'locations.html';
  } catch (err) {
    showError(errorEl, err.message);
  }
});
