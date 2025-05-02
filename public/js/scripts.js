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
          // Show a success message that the email verification has been sent
          alert('A verification link has been sent to your email. Please check and verify your account.');
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
          // Store token and user info in localStorage
          localStorage.setItem('jwtToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
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

// ----------------------
// Helper Functions
// ----------------------

function loadWorkerTasks(filter = "") {
  const token = localStorage.getItem('jwtToken');
  const user  = JSON.parse(localStorage.getItem('user'));
  if (user?.username) {
    $('#welcomeMessage').text(`Welcome, ${user.username}`);
  }

  $.ajax({
    method: "GET",
    url: "/api/tasks",
    headers: { Authorization: `Bearer ${token}` },
    success: tasks => {
      // My Tasks
      const myTasks = tasks.filter(task => {
        if (!task.assignedTo) return false;
        const id = task.assignedTo._id
          ? task.assignedTo._id.toString()
          : task.assignedTo;
        return id === user.id && task.status !== 'Completed';
      });

      // Available Tasks
      const available = tasks.filter(t =>
        !t.assignedTo && t.status !== 'Completed'
      );

      const fl = filter.toLowerCase();
      const filteredMy = myTasks.filter(t =>
        t.title.toLowerCase().includes(fl) ||
        t.description.toLowerCase().includes(fl)
      );
      const filteredAvail = available.filter(t =>
        t.title.toLowerCase().includes(fl) ||
        t.description.toLowerCase().includes(fl)
      );

      // Render
      const $myList = $('#my-task-list').empty();
      filteredMy.forEach(renderTaskCard.bind(null, $myList, true));
      const $availList = $('#worker-task-list').empty();
      filteredAvail.forEach(renderTaskCard.bind(null, $availList, false));
    },
    error: err => console.error('Error loading tasks', err)
  });
}

// Renders a task card into $container; isMine toggles “Working/Completed” vs “Accept”
function renderTaskCard($container, isMine, task) {
  const due = new Date(task.dueDate).toLocaleDateString();
  let actions = '';
  if (isMine) {
    actions = `
      <a href="#" onclick="updateTaskStatus('${task._id}','Working')">Working</a>
      <a href="#" onclick="updateTaskStatus('${task._id}','Completed')">Completed</a>
    `;
  } else {
    actions = `<a href="#" onclick="acceptTask('${task._id}')">Accept</a>`;
  }

  $container.append(`
    <div class="col s12 ${isMine ? '' : 'm6'}">
      <div class="card">
        <div class="card-content">
          <span class="card-title">${task.title}</span>
          <p>${task.description}</p>
          <p>Due: ${due}</p>
          <p>Status: ${task.status}</p>
        </div>
        <div class="card-action">${actions}</div>
      </div>
    </div>
  `);
}

function acceptTask(id) {
  const token = localStorage.getItem('jwtToken');
  const user  = JSON.parse(localStorage.getItem('user'));
  $.ajax({
    method: "PUT",
    url: `/api/tasks/${id}`,
    headers: { Authorization: `Bearer ${token}` },
    contentType: "application/json",
    data: JSON.stringify({ assignedTo: user.id }),
    success: () => loadWorkerTasks(),
    error: err => console.error('Error accepting task:', err)
  });
}

function updateTaskStatus(id, status) {
  const token = localStorage.getItem('jwtToken');
  $.ajax({
    method: "PUT",
    url: `/api/tasks/${id}`,
    headers: { Authorization: `Bearer ${token}` },
    contentType: "application/json",
    data: JSON.stringify({ status }),
    success: () => loadWorkerTasks(),
    error: err => console.error('Error updating status:', err)
  });
}

function loadAdminTasks() {
  const token = localStorage.getItem('jwtToken');
  $.ajax({
    method: "GET",
    url: "/api/tasks",
    headers: { Authorization: `Bearer ${token}` },
    success: tasks => {
      const $list = $('#admin-task-list').empty();
      tasks.forEach(task => {
        const due = new Date(task.dueDate).toLocaleDateString();
        const asg = task.assignedTo ? task.assignedTo.username : 'Unassigned';
        $list.append(`
          <div class="col s12 m6 l4">
            <div class="card">
              <div class="card-content">
                <span class="card-title">${task.title}</span>
                <p>${task.description}</p>
                <p>Due: ${due}</p>
                <p>Status: ${task.status}</p>
                <p>Assigned to: ${asg}</p>
              </div>
              <div class="card-action">
                <a href="#" onclick="editTask('${task._id}')">Edit</a>
                <a href="#" onclick="deleteTask('${task._id}')">Delete</a>
                <a href="#" onclick="updateTaskStatus('${task._id}','Completed')">Completed</a>
              </div>
            </div>
          </div>
        `);
      });
    },
    error: err => console.error('Error loading admin tasks', err)
  });
}

function editTask(id) {
  const token = localStorage.getItem('jwtToken');
  $.ajax({
    method: "GET",
    url: `/api/tasks/${id}`,
    headers: { Authorization: `Bearer ${token}` },
    success: task => {
      $('#edit_task_id').val(task._id);
      $('#edit_task_title').val(task.title);
      $('#edit_task_description').val(task.description);
      if (task.dueDate) {
        $('#edit_task_dueDate').val(new Date(task.dueDate).toISOString().split('T')[0]);
      }
      $('#edit_task_assignedTo').val(
        task.assignedTo?.email || task.assignedTo?.username || ''
      );
      M.updateTextFields();
      $('#editTaskModal').modal('open');
    },
    error: err => console.error('Error fetching task for edit', err)
  });
}

$('#editTaskForm').submit(function(e) {
  e.preventDefault();
  const token  = localStorage.getItem('jwtToken');
  const id     = $('#edit_task_id').val();
  const payload= {
    title:      $('#edit_task_title').val(),
    description:$('#edit_task_description').val(),
    dueDate:     $('#edit_task_dueDate').val(),
    assignedTo:  $('#edit_task_assignedTo').val() || undefined
  };
  $.ajax({
    method: "PUT",
    url: `/api/tasks/${id}`,
    headers: { Authorization: `Bearer ${token}` },
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: () => {
      $('#editTaskModal').modal('close');
      loadAdminTasks();
    },
    error: err => console.error('Error updating task', err)
  });
});

function deleteTask(id) {
  if (!confirm('Sure you want to delete?')) return;
  const token = localStorage.getItem('jwtToken');
  $.ajax({
    method: "DELETE",
    url: `/api/tasks/${id}`,
    headers: { Authorization: `Bearer ${token}` },
    success: () => loadAdminTasks(),
    error: err => console.error('Error deleting task', err)
  });
}

// 🔔 NOTIFS: in‑memory notification store
let notifications = [];

// 🔔 NOTIFS: helper to prepend a message + bump badge
function addNotification(message) {
  notifications.unshift(message);
  $('#notifDropdown .no-notifs').remove();

  const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  $('#notifDropdown').prepend(`
    <li class="notif-item">
      <span>${message}</span>
      <small class="grey-text text-darken-1">${time}</small>
    </li>
    <li class="divider" tabindex="-1"></li>
  `);

  $('#notification-count')
    .text(notifications.length)
    .show();
}


$('#addTaskForm').submit(function(e) {
  e.preventDefault();
  const token       = localStorage.getItem('jwtToken');
  const title       = $('#task_title').val().trim();
  const description = $('#task_description').val().trim();
  const dueDate     = $('#task_dueDate').val();
  const assignVal   = $('#task_assignedTo').val().trim();

  const payload = { title, description, dueDate };
  if (assignVal) payload.assignedTo = assignVal;

  $.ajax({
    method: "POST",
    url: "/api/tasks",
    headers: { Authorization: `Bearer ${token}` },
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: () => {
      // Close the Add‑Task modal
      $('#modalAddTask').modal('close');

      // Then reload both dashboards
      loadAdminTasks();
      loadWorkerTasks();
    },
    error: err => console.error('Error creating task', err)
  });
});

function loadWorkers() {
  const token = localStorage.getItem('jwtToken');
  $.ajax({
    method: "GET",
    url: "/api/workers",
    headers: { Authorization: `Bearer ${token}` },
    success: workers => {
      const $w = $('#worker-list').empty();
      workers.forEach(w => {
        const status = w.currentTaskCount > 0
          ? `Working on ${w.currentTaskCount} tasks`
          : 'Free';
        $w.append(`
          <li class="collection-item">
            <strong>${w.username}</strong><br/>
            Email: ${w.email}<br/>
            Status: ${status}
          </li>
        `);
      });
    },
    error: err => console.error('Error loading workers', err)
  });
}

// ----------------------
// Document Ready
// ----------------------
$(document).ready(function() {
  // Materialize init
  $('select').formSelect();
  $('.modal').modal();

  // 🔔 NOTIFS: initialize the notifications dropdown
  const dropdowns = document.querySelectorAll('.dropdown-trigger');
  M.Dropdown.init(dropdowns, {
    coverTrigger: false,
    constrainWidth: false
  });

  // 🔔 NOTIFS: clear badge when user clicks the bell
  $('.dropdown-trigger').on('click', () => {
    notifications = [];
    $('#notification-count').hide().text('0');
  });

  // Socket.io if available
  if (typeof io === 'function') {
    const socket = io();

    // existing real‑time handlers plus notif logic
    socket.on('task:created', task => {
      addNotification(`New task “${task.title}” created.`);
      loadAdminTasks();
      loadWorkerTasks();
    });
    socket.on('task:updated', task => {
      addNotification(`Task “${task.title}” updated.`);
      loadAdminTasks();
      loadWorkerTasks();
    });
    socket.on('task:deleted', ({ title }) => {
      console.log('received delete evt for:', title);
      addNotification(`Task "${title}" deleted.`);
      loadAdminTasks();
      loadWorkerTasks();
    });
    
  }

  // Initial loads
  loadWorkerTasks();
  loadAdminTasks();
  loadWorkers();

  // UI bindings
  $('#filter_btn').click(() =>
    loadWorkerTasks($('#filter_input').val())
  );

  // Auth forms
  $('#loginForm').submit(function(e) {
    e.preventDefault();
    $.post('/api/auth/login', {
      email:    $('#login_email').val(),
      password: $('#login_password').val()
    })
    .done(data => {
      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = data.user.role === 'admin'
        ? '/pages/admin-dashboard.html'
        : '/pages/worker-dashboard.html';
    })
    .fail(() => alert('Login failed'));
  });

  $('#registerForm').submit(function(e) {
    e.preventDefault();
    $.post('/api/auth/register', {
      username: $('#register_username').val(),
      email:    $('#register_email').val(),
      password: $('#register_password').val(),
      role:     $('#register_role').val()
    })
    .done(() => window.location.href = '/pages/login.html')
    .fail(() => alert('Registration failed'));
  });

  $('#forgotForm').submit(function(e) {
    e.preventDefault();
    $.post('/api/auth/forgot', { email: $('#forgot_email').val() })
      .done(res => alert(res.message))
      .fail(xhr => alert('Error: ' + xhr.responseJSON.error));
  });

  $('#resetForm').submit(function(e) {
    e.preventDefault();
    const token = new URLSearchParams(window.location.search).get('token');
    $.post(`/api/auth/reset/${token}`, { password: $('#newPassword').val() })
      .done(res => {
        alert(res.message);
        window.location.href = '/pages/login.html';
      })
      .fail(xhr => alert('Error: ' + xhr.responseJSON.error));
  });
});
