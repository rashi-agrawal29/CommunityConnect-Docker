document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminLoginForm');
  const errorBox = document.getElementById('admin-error');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('admin_email').value;
      const password = document.getElementById('admin_password').value;

      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('jwtToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = data.redirectTo;
        } else {
          errorBox.innerText = data.message || 'Login failed';
          errorBox.style.display = 'block';
        }
      } catch (err) {
        console.error(err);
        errorBox.innerText = 'Login error. Try again.';
        errorBox.style.display = 'block';
      }
    });
    return; // prevent dashboard logic from running on login page
  }

  // DASHBOARD HANDLING (only runs if no login form found)
  const token = localStorage.getItem('jwtToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user || !user.isAdmin) {
    alert('Unauthorized access');
    window.location.href = '/pages/admin-login.html';
    return;
  }

  fetch('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const userList = document.getElementById('adminUsers');
      const taskList = document.getElementById('adminTasks');

      if (!userList || !taskList) {
        console.error('Missing table element in DOM');
        return;
      }

      userList.innerHTML = '';
      taskList.innerHTML = '';

      data.users.forEach(u => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${u.displayName || u.name}</td>
          <td>${u.email}</td>
          <td>${u.isVerified ? 'Yes' : 'No'}</td>
          <td>${u.isAdmin ? 'Admin' : 'User'}</td>
        `;
        userList.appendChild(row);
      });

      data.tasks.forEach(t => {
        const assigned = t.assignedTo?.displayName || t.assignedTo?.name || 'Unassigned';
        const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A';
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${t.title}</td>
          <td>${assigned}</td>
          <td>${t.status}</td>
          <td>${dueDate}</td>
        `;
        taskList.appendChild(row);
      });
    })
    .catch(err => {
      console.error('Failed to load dashboard:', err);
      alert('Failed to load admin dashboard.');
    });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async e => {
      e.preventDefault();
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      await fetch('/logout', { method: 'GET', credentials: 'include' });
      window.location.href = '/pages/admin-panel.html';
    });
  }
});
