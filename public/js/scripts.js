document.addEventListener('DOMContentLoaded', function () {
  // Register form submission handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name = document.getElementById('name').value;  // 'name' is the single field now
      const email = document.getElementById('register_email').value;
      const password = document.getElementById('register_password').value;

      const errorBox = document.getElementById('register-error');
      errorBox.style.display = 'none';
      errorBox.innerText = '';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert('Registration successful!');
          window.location.href = '/pages/login.html';
        } else {
          errorBox.style.display = 'block';
          errorBox.innerText = data.message || 'Something went wrong!';
        }

      } catch (err) {
        console.error(err);
        errorBox.style.display = 'block';
        errorBox.innerText = 'Failed to connect to server.';
      }
    });
  }

  // Login form submission handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = document.getElementById('login_email').value;
      const password = document.getElementById('login_password').value;

      const errorBox = document.getElementById('login-error');
      errorBox.style.display = 'none';
      errorBox.innerText = '';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert('Login successful!');
          // Redirect to the landing page after successful login
          window.location.href = data.redirectTo;
        } else {
          errorBox.style.display = 'block';
          errorBox.innerText = data.message || 'Something went wrong!';
        }

      } catch (err) {
        console.error(err);
        errorBox.style.display = 'block';
        errorBox.innerText = 'Failed to connect to server.';
      }
    });
  }
});
