// Register form submission handler
document.addEventListener('DOMContentLoaded', function () {

  // Capture token from URL (Google Login)
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');

  if (tokenFromUrl) {
    // Store the token in localStorage
    localStorage.setItem('jwtToken', tokenFromUrl);

    // Clean up URL to remove the token from the address bar
    const urlWithoutToken = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, urlWithoutToken);
  }

  // Grab the user object saved on login
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // 🔔 Initialize Socket.io connection for real-time notifications
  if (user.id) {
    const socket = io('http://localhost:3000'); // Will change to our production domain

    // Register the user for their personal notification channel
    socket.emit('register', user.id);

    // Handle incoming real-time notifications
    socket.on('newNotification', function (notification) {
      // Increment badge count
      const badge = document.getElementById('notification-count');
      if (badge) {
        const currentCount = parseInt(badge.innerText || '0');
        badge.innerText = currentCount + 1;
        badge.style.display = 'inline-block';
      }

      // Update notification dropdown only if it's visible
      if ($('#notificationDropdown').is(':visible')) {
        showNotifications(); // re-fetch from server and update UI
      }
    });
  }


  // If we have a name or username, show it
  
  const navWelcome = document.getElementById('navWelcome');
  if (navWelcome && user.username) {
    navWelcome.innerText = `Welcome, ${user.username}`;
  }
  

  
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
  

    // the logout handler:
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async e => {
        e.preventDefault();
        // clear client storage
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('user');
        // hit the server logout endpoint
        await fetch('/logout', { method: 'GET', credentials: 'include' });
        // then redirect
        window.location.href = '/pages/login.html';
      });
    } 
});

// ----------------------
// Helper Functions
// ----------------------

function loadWorkerTasks(filter = "") {
  const token = localStorage.getItem('jwtToken');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.username) {
    $('#welcomeMessage').text(`Welcome, ${user.username}`);
  }

  $.ajax({
    method: "GET",
    url: "/api/tasks",
    headers: { Authorization: `Bearer ${token}` },
    success: tasks => {
      // My Tasks (assigned to me, not completed)
      const myTasks = tasks.filter(task => {
        if (!task.assignedTo) return false;
        const id = task.assignedTo._id
          ? task.assignedTo._id.toString()
          : task.assignedTo;
        return id === user.id && task.status !== 'Completed';
      });

      // Available Tasks (unassigned, not completed, not created by me)
      const available = tasks.filter(task => {
        if (task.assignedTo) return false;

        // skip if createdBy is missing
        if (!task.createdBy) return false;

        const creatorId = typeof task.createdBy === 'object' && task.createdBy._id
          ? task.createdBy._id.toString()
          : task.createdBy;
        if (creatorId === user.id) return false;
        // must still be open
        return task.status !== 'Completed';
      });
      const fl = filter.toLowerCase();

      const filteredMy    = myTasks.filter(t =>
        t.title.toLowerCase().includes(fl) ||
        t.description.toLowerCase().includes(fl)
      );
      const filteredAvail = available.filter(t =>
        t.title.toLowerCase().includes(fl) ||
        t.description.toLowerCase().includes(fl)
      );

      // Render My Tasks
      const $myList = $('#my-task-list').empty();
      filteredMy.forEach(renderTaskCard.bind(null, $myList, true));
       if (filteredMy.length === 0) {
        $myList.html('<p class="center grey-text">You have no ongoing tasks.</p>');
      }

      // Render Available Tasks
      const $availList = $('#worker-task-list').empty();
      filteredAvail.forEach(renderTaskCard.bind(null, $availList, false));
      if (filteredAvail.length === 0) {
        $availList.html('<p class="center grey-text">No available tasks right now.</p>');
      }
    },
    error: err => console.error('Error loading tasks', err)
  });
}

// Renders a task card into $container; isMine toggles “Working/Completed” vs “Apply”
function renderTaskCard($container, isMine, task) {
  const due = new Date(task.dueDate).toLocaleDateString();

  // 1) Actions
let actions = '';
if (isMine) {
  const dropdownId = `wk-actions-${task._id}`;
  actions = `
    <!-- trigger icon -->
    <a class="dropdown-trigger" href="#!" data-target="${dropdownId}">
      <i class="material-icons">more_vert</i>
    </a>
    <!-- menu contents -->
    <ul id="${dropdownId}" class="dropdown-content">
      <li>
        <a href="#!" onclick="updateTaskStatus('${task._id}','Working')">
          Working
        </a>
      </li>
      <li>
        <a href="#!" onclick="updateTaskStatus('${task._id}','Completed')">
          Completed
        </a>
      </li>
    </ul>
  `;
}
 else {
    const appliedTasks = JSON.parse(localStorage.getItem('appliedTasks')) || [];
    const isApplied = appliedTasks.includes(task._id);
    actions = isApplied
      ? `<button class="btn-flat apply-btn" disabled>Applied</button>`
      : `<button class="btn-flat apply-btn" style="color:#039be5;" data-task-id="${task._id}">Apply</button>`;
  }

  // 2) Badges
  const statusBadge = `<span class="badge badge-${task.status.toLowerCase()}">${task.status}</span>`;
  const dueBadge    = `<span class="badge badge--due">Due ${due}</span>`;

  // 3) Avatar
  const asg = task.assignedTo
    ? (task.assignedTo.name || task.assignedTo.displayName || task.assignedTo.email)
    : 'Unassigned';
  const initials = asg.slice(0,2).toUpperCase();
  const avatar   = `<div class="user-avatar">${initials}</div>`;

  // 4) Append the card (notice where we inject our comment-toggle button and hidden panel)
  $container.append(`
    <div class="col s12 ${isMine ? '' : 'm6'} l4">
      <div class="card">
        <div class="card-content">
          <div style="display:flex; align-items:center; margin-bottom:.5rem; position:relative;">
            ${avatar}
            <span class="card-title" style="margin:0">${task.title}</span>
             ${isMine ? actions : ''}
          </div>
          <p>${task.description}</p>
          <p>${dueBadge} ${statusBadge}</p>
        </div>
        <div class="card-action" style="display:flex; align-items:center; gap:1rem">
         
          <!-- ⬇️  comment-toggle button: -->
          <button class="btn-flat comment-toggle" data-task-id="${task._id}">
            <i class="material-icons left">chat_bubble_outline</i>
            Comments
          </button>
          <i class="material-icons left">person</i>${asg}
        </div>

        <!-- ⬇️ comment panel, hidden by default: -->
        <div class="comments-section" data-task-id="${task._id}" style="display:none; padding:1rem 1.5rem;">
          <div class="comment-list"></div>
          <div class="comment-form" style="display:flex; align-items:center; margin-top:.5rem;">
            <input
              type="text"
              class="comment-input"
              placeholder="Add a comment…"
              style="flex:1; margin-right:.5rem;"
            >
            <button class="btn-flat comment-submit" data-task-id="${task._id}">
              <i class="material-icons">send</i>
            </button>
          </div>
        </div>

      </div>
    </div>
  `);
}



function loadAdminTasks() {
  const token = localStorage.getItem('jwtToken');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  $.ajax({
    method: "GET",
    url: "/api/tasks",
    headers: { Authorization: `Bearer ${token}` },
    success: tasks => {
      // only keep tasks this user created
      const myTasks = tasks.filter(t => {
        const creatorId = t.createdBy?._id || t.createdBy?.id;
        return creatorId === user.id;
      });
  
    const $list = $('#admin-task-list').empty();
    myTasks.forEach(task => renderTaskCardAdmin($list, task));
    },
    error: err => console.error('Error loading admin tasks', err)
  });
}

function renderTaskCardAdmin($container, task) {
  const dueDate = new Date(task.dueDate).toLocaleDateString();
  // badges
  const statusBadge = `<span class="badge badge--${task.status.toLowerCase()}">${task.status}</span>`;
  const dueBadge    = `<span class="badge badge--due">Due ${dueDate}</span>`;
  // assignee
  const assigneeName = task.assignedTo
    ? (task.assignedTo.displayName || task.assignedTo.name || task.assignedTo.email)
    : 'Unassigned';
  // avatar initial
  const avatarLetter = assigneeName.charAt(0).toUpperCase();
  const avatar = `<div class="avatar">${avatarLetter}</div>`;
  // action links
  const dropdownId = `admin-actions-${task._id}`;
const actions = `
  <a class="dropdown-trigger" href="#!" data-target="${dropdownId}">
    <i class="material-icons">more_vert</i>
  </a>
  <ul id="${dropdownId}" class="dropdown-content">
    <li>
      <a href="#!" onclick="editTask('${task._id}')">Edit</a>
    </li>
    <li>
      <a href="#!" onclick="deleteTask('${task._id}')">Delete</a>
    </li>
  </ul>
`;


$container.append(`
    <div class="col s12 m6 l4">
      <div class="card task-card-admin">
        <div class="card-content">
          <div class="card-header"style="display:flex; align-items:center; position:relative;">
            ${avatar}
            <span class="card-title">${task.title}</span>
            ${actions}
          </div>
          <p>${task.description}</p>
          <p>${statusBadge} ${dueBadge}</p>
          <p>Assigned to: ${assigneeName}</p>
        </div>

        <div class="card-action">
          <!-- Comment toggle button -->
          <button
            class="btn-flat comment-toggle"
            data-task-id="${task._id}"
            style="margin-left:1rem;">
            <i class="material-icons left" style="font-size:1.1rem">
              chat_bubble_outline
            </i>
            Comments
          </button>
        </div>

        <!-- Comments section (hidden by default) -->
        <div
          class="comments-section"
          data-task-id="${task._id}"
          style="display:none; margin:1rem;">
          
          <div class="comment-list"></div>
          
          <div class="comment-form" style="display:flex; align-items:center; margin-top:0.5rem;">
            <input
              type="text"
              class="comment-input"
              placeholder="Add a comment…"
              style="flex:1; margin-right:0.5rem;"
            >
            <button
              class="btn-flat comment-submit"
              data-task-id="${task._id}"
            >
              <i class="material-icons" style="vertical-align:middle">
                send
              </i>
            </button>
          </div>
        </div>

      </div>
    </div>
  `);

  // at the bottom of scripts.js, or right after you append cards:
document.querySelectorAll('.dropdown-trigger').forEach(el => {
  M.Dropdown.init(el, {
    coverTrigger: false,
    constrainWidth: false
  });
});

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
    error: xhr => {
      // pull the message from your 400 response, or fallback
      const msg = xhr.responseJSON?.error || 'Failed to create task.';
      $('#taskError').text(msg).show();
    }
  });
});

function loadWorkers() {
  const token = localStorage.getItem('jwtToken');
  $.ajax({
    url: '/api/workers',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    },
    success: workers => {
      const $list = $('#worker-list').empty();
  workers.forEach(w => {
    const display = w.name || w.displayName || w.email;
    const status  = w.currentTaskCount > 0
      ? `Working on ${w.currentTaskCount} task${w.currentTaskCount > 1 ? 's' : ''}`
      : 'Free';
    $list.append(`
      <li class="collection-item">
        <strong>${display}</strong><br>
        Email: ${w.email}<br>
        Status: ${status}
      </li>
        `);
      });
    },
    error: err => console.error('Error loading workers', err)
  });
}

function editTask(taskId) {
  const token = localStorage.getItem('jwtToken');

  // Fetch existing task data
  $.ajax({
    method: 'GET',
    url: `/api/tasks/${taskId}`,
    headers: { Authorization: `Bearer ${token}` },
    success: task => {
      $('#task_title').val(task.title);
      $('#task_description').val(task.description);
      $('#task_dueDate').val(task.dueDate.split('T')[0]);
      $('#task_assignedTo').val(task.assignedTo?.email || task.assignedTo?.name || '');
      M.updateTextFields();

      // Change submit behavior
      $('#addTaskForm').off('submit').on('submit', function (e) {
        e.preventDefault();

        const payload = {
          title: $('#task_title').val().trim(),
          description: $('#task_description').val().trim(),
          dueDate: $('#task_dueDate').val(),
        };

        const assignedTo = $('#task_assignedTo').val().trim();
        if (assignedTo) {
          payload.assignedTo = assignedTo;
        } else {
          payload.assignedTo = null;
        }

        $.ajax({
          method: 'PUT',
          url: `/api/tasks/${taskId}`,
          headers: { Authorization: `Bearer ${token}` },
          contentType: "application/json",
          data: JSON.stringify(payload),
          success: () => {
            $('#modalAddTask').modal('close');
            loadAdminTasks();
            loadWorkerTasks();
            resetAddTaskForm();
          },
          error: err => {
            console.error('Error updating task', err);
            alert('Failed to update task.');
          }
        });
      });

      $('#modalAddTask').modal('open');
    },
    error: err => {
      console.error('Failed to load task for editing:', err);
      alert('Failed to load task data.');
    }
  });
}

function resetAddTaskForm() {
  $('#addTaskForm')[0].reset();
  $('#addTaskForm').off('submit').on('submit', defaultAddHandler);
}

function defaultAddHandler(e) {
  e.preventDefault();
  const token = localStorage.getItem('jwtToken');
  const title = $('#task_title').val().trim();
  const description = $('#task_description').val().trim();
  const dueDate = $('#task_dueDate').val();
  const assignVal = $('#task_assignedTo').val().trim();

  const payload = { title, description, dueDate };
  if (assignVal) payload.assignedTo = assignVal;

  $.ajax({
    method: "POST",
    url: "/api/tasks",
    headers: { Authorization: `Bearer ${token}` },
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: () => {
      // Close the Add-Task modal
      $('#modalAddTask').modal('close');

      // Then reload both dashboards
      loadAdminTasks();
      loadWorkerTasks();
    },
    error: err => console.error('Error creating task', err)
  });
}

function deleteTask(taskId) {
  const confirmed = confirm('Are you sure you want to delete this task?');
  if (!confirmed) return;

  const token = localStorage.getItem('jwtToken');
  $.ajax({
    method: 'DELETE',
    url: `/api/tasks/${taskId}`,
    headers: { Authorization: `Bearer ${token}` },
    success: () => {
      loadAdminTasks();
      loadWorkerTasks();
    },
    error: err => console.error('Error deleting task', err)
  });
}

function applyForTask(taskId, btnElement) {
  const token = localStorage.getItem('jwtToken');

  $.ajax({
    method: 'PUT',
    url: `/api/workers/apply/${taskId}`,
    headers: { Authorization: `Bearer ${token}` },
    success: () => {
      $(btnElement).text('Applied').prop('disabled', true);

      // Save applied task ID in localStorage
      let appliedTasks = JSON.parse(localStorage.getItem('appliedTasks') || '[]');
      if (!appliedTasks.includes(taskId)) {
        appliedTasks.push(taskId);
        localStorage.setItem('appliedTasks', JSON.stringify(appliedTasks));
      }
    },
    error: err => console.error('Failed to apply for task', err)
  });
}

$(function() {
  const token = localStorage.getItem('jwtToken');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Toggle comment section open/closed
  $(document).on('click', '.comment-toggle', function(e) {
    e.preventDefault();
    const taskId = $(this).data('task-id');
    const $section = $(`.comments-section[data-task-id="${taskId}"]`);

    if ($section.is(':visible')) {
      $section.hide();
    } else {
      // first load comments from server
      loadComments(taskId);
      $section.show();
    }
  });

  // Submit a new comment
  $(document).on('click', '.comment-submit', function(e) {
    e.preventDefault();
    const taskId = $(this).data('task-id');
    const $section = $(`.comments-section[data-task-id="${taskId}"]`);
    const $input = $section.find('.comment-input');
    const text = $input.val().trim();
    if (!text) return;

    $.ajax({
      method: 'POST',
  url: `/api/comments/task/${taskId}`,
  headers: { Authorization: `Bearer ${token}` },
  contentType: 'application/json',
  data: JSON.stringify({ description: text }), 
    })
    .done(() => {
      $input.val('');          // clear
      loadComments(taskId);     // reload list
    })
    .fail(err => console.error('Comment create error', err));
  });

  // Delete a comment (only shown on your own)
  $(document).on('click', '.comment-delete', function(e) {
    e.preventDefault();
    const commentId = $(this).data('comment-id');
    const taskId    = $(this).data('task-id');

    $.ajax({
      method: 'DELETE',
      url: `/api/comments/${commentId}`,
      headers: { Authorization: `Bearer ${token}` },
    })
    .done(() => loadComments(taskId))
    .fail(err => console.error('Comment delete error', err));
  });

  // Helper: fetch & render comments for one task
  function loadComments(taskId) {
    const $list = $(`.comments-section[data-task-id="${taskId}"] .comment-list`);
    $list.empty();
    $.ajax({
      method: 'GET',
      url: `/api/comments/task/${taskId}`,
      headers: { Authorization: `Bearer ${token}` },
    })
    .done(comments => {
      if (!comments.length) {
        $list.append(`<p style="font-style:italic;color:#666">No comments yet.</p>`);
        return;
      }
      comments.forEach(c => {
        // build delete button if it's yours
        const canDelete = c.createdBy._id === currentUser.id;
        const deleteBtn = canDelete
          ? `<button class="btn-flat comment-delete"
                       data-comment-id="${c._id}"
                       data-task-id="${taskId}"
                       style="font-size:.9rem;color:#e53935">
                <i class="material-icons tiny">delete</i>
             </button>`
          : '';

        $list.append(`
          <div class="comment-item" style="display:flex;align-items:center;margin:4px 0;">
            <div style="flex:1;">
              <strong>${c.createdBy.displayName || c.createdBy.name}:</strong>
              <span style="margin-left:.4rem;">${c.description}</span><br>
              <small style="color:#999;">${new Date(c.createdAt).toLocaleString()}</small>
            </div>
            ${deleteBtn}
          </div>
        `);
      });
    })
    .fail(err => console.error('Comment load error', err));
  }
});




$(document).ready(function() {
  // Materialize init
  $('select').formSelect();
  $('.modal').modal();

  // NOTIFS: initialize the notifications dropdown
  const dropdowns = document.querySelectorAll('.dropdown-trigger');
  M.Dropdown.init(dropdowns, {
    coverTrigger: false,
    constrainWidth: false
  });

  let dropdownLoaded = false;
  $('.notification-icon').on('click', function (e) {
    e.stopPropagation(); // Prevent closing when clicking the bell

    if (!dropdownLoaded) {
      $('#notification-modal-placeholder').load('/components/notificationModal.html', function () {
        dropdownLoaded = true;
        showNotifications();
        $('#notificationDropdown').fadeIn(200);
      });
    } else {
      const dropdown = $('#notificationDropdown');
      dropdown.is(':visible') ? dropdown.fadeOut(200) : dropdown.fadeIn(200);
      showNotifications();
    }
  });

  // Hide dropdown when clicking outside
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.notification-dropdown, .notification-icon').length) {
      $('#notificationDropdown').fadeOut(200);
    }
  });

  // Function to fetch and show notifications
  function showNotifications() {
    const token = localStorage.getItem('jwtToken');
    $.ajax({
      method: 'GET',
      url: '/api/workers/notifications',
      headers: { Authorization: `Bearer ${token}` },
      success: notes => {
        const $list = $('#notificationList').empty();
        const $badge = $('#notification-count');

        // Update badge count
        if (notes.length > 0) {
          $badge.text(notes.length).show();
        } else {
          $badge.hide();
        }

        if (notes.length === 0) {
          $list.append('<li class="collection-item">No notifications</li>');
        } else {
          notes.forEach(note => {
            const time = new Date(note.createdAt).toLocaleString();
            $list.append(`
              <li class="collection-item">
                <strong>${note.message || 'No message'}</strong><br>
                <small class="grey-text">${time}</small>
              </li>
            `);
          });
        }

        // Ensure button exists and bind event
        $('#clearNotificationsBtn').off('click').on('click', function () {
          clearAllNotifications();
        });
      },
      error: err => console.error('Notification load error', err)
    });
  }

  function clearAllNotifications() {
    const token = localStorage.getItem('jwtToken');
    $.ajax({
      method: 'DELETE',
      url: '/api/workers/notifications',
      headers: { Authorization: `Bearer ${token}` },
      success: () => {
        $('#notificationList').html('<li class="collection-item">No notifications</li>');
        $('#notification-count').hide();
      },
      error: err => console.error('Failed to clear notifications', err)
    });
  }
  loadWorkerTasks();
  loadWorkers();     // fills the “Workers” sidebar
  loadAdminTasks();  // populates #admin-task-list with existing tasks
  showNotifications();

  $(document).on('click', '.apply-btn', function () {
    const taskId = $(this).data('task-id');
    const btn = this;
    applyForTask(taskId, btn);
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