import HiveKeychain from 'hive-keychain'

// Función para verificar si el usuario está autenticado
function isLoggedIn() {
    return localStorage.getItem("hive_username") !== null;
  }
  
  // Función para obtener el nombre de usuario del local storage
  function getUsername() {
    return localStorage.getItem("hive_username");
  }
  
  // Función para cerrar sesión
  function logout() {
    localStorage.removeItem("hive_username");
    // Actualizar interfaz
    updateUI();
    // Redirigir a inicio.html
    window.location.href = "inicio.html";
  }
  
  // Función para actualizar la interfaz
  function updateUI() {
    const loginButton = document.getElementById("login-button");
    const logoutMenu = document.getElementById("logout-menu");
    const usernameButton = document.getElementById("username-button");
    
    if (isLoggedIn()) {
      // Mostrar menú de usuario
      loginButton.style.display = "none";
      logoutMenu.style.display = "block";
      // Mostrar nombre de usuario en botón de menú
      usernameButton.innerHTML = getUsername();
      usernameButton.dataset.usernameButton = ""; // Agregar atributo data-username-button
      // Redirigir a dashboard.html si estamos en inicio.html
      if (window.location.pathname === "/inicio.html") {
        window.location.href = "dashboard.html";
      }
    } else {
      // Ocultar menú de usuario
      loginButton.style.display = "block";
      logoutMenu.style.display = "none";
      // Redirigir a inicio.html si estamos en otra página
      if (window.location.pathname !== "/inicio.html") {
        window.location.href = "inicio.html";
      }
    }
  }
  
  // Función para iniciar sesión
  function login() {
    const usernameInput = document.getElementById("username");
    const postingKeyInput = document.getElementById("posting-key");
    const loginError = document.getElementById("login-error");
    const username = usernameInput.value.trim().toLowerCase();
    const postingKey = postingKeyInput.value.trim();
  
    // Verificar si el usuario existe en el servidor
    fetch(`https://api.hive.blog/accounts/${username}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.name === username) {
          // Usuario existe, verificar la clave
          const postingAuth = Hive.auth.toWif(username, "posting", postingKey);
          if (postingAuth === data.posting.key_auths[0][0]) {
            // Clave correcta, guardar en el local storage
            localStorage.setItem("hive_username", username);
            // Actualizar interfaz
            updateUI();
            // Cerrar el modal
            const loginModal = document.getElementById("login-modal");
            const modal = bootstrap.Modal.getInstance(loginModal);
            modal.hide();
          } else {
            loginError.innerHTML = "Invalid posting key.";
          }
        } else {
          loginError.innerHTML = "Invalid username.";
        }
      })
      .catch((error) => {
        console.error(error);
        loginError.innerHTML = "Failed to connect to server.";
      });
  }
  
// Selección de elementos del DOM
const loginForm = document.getElementById('login-form');
const loginFormBtn = document.getElementById('login-form-btn');
const loginModalCancelBtn = document.getElementById('login-modal-cancel-btn');
const usernameInput = document.getElementById('username');
const postingKeyInput = document.getElementById('posting-key');
const loginError = document.getElementById('login-error');

// Función para limpiar los campos de entrada del modal
function clearLoginForm() {
  usernameInput.value = '';
  postingKeyInput.value = '';
  loginError.textContent = '';
}

// Función de inicio de sesión
function login() {
  // Aquí colocas la lógica de inicio de sesión
}

// Evento de envío de formulario
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  login();
});

// Evento de clic en el botón de cancelar del modal
loginModalCancelBtn.addEventListener('click', function() {
  clearLoginForm();
});

// Evento de apertura del modal
$('#login-modal').on('shown.bs.modal', function () {
  usernameInput.focus();
});

  // Actualizar interfaz al cargar la página
  document.addEventListener("DOMContentLoaded", updateUI);
