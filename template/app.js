console.log("✅ app.js activo y listo para probar");

// Función para mostrar vistas
async function cargarVista(vista, evento) {
  if (evento) evento.preventDefault();
  const contenedor = document.getElementById("contenido");
  try {
    const respuesta = await fetch(vista + ".html"); // Carga archivo externo
    if (!respuesta.ok) throw new Error("No se pudo encontrar la vista: " + vista);
    const html = await respuesta.text();
    contenedor.innerHTML = html;
    // --- EJECUCIÓN DE SCRIPTS SEGÚN LA VISTA ---
    if (vista.includes("tarjetas-conjuntos")) {
    }
    else if (vista === "graficos") {
      inicializarGraficos();
    }
    // Evaluamos si es la vista de registro (ya sea en raíz o subcarpeta)
    else if (vista.includes("register") || vista === "registro") {
      if (typeof inicializarVistas === "function") {
        inicializarVistas(); // Activa la escucha del botón de registro en app.js
      }
    }
    else if (vista.includes("login")) {
      if (typeof inicializarLogin === "function") {
        inicializarLogin(); // Activa la escucha del formulario de login
      }
    }
    else if (vista.includes("formulario-propietario")) {
      if (typeof inicializarPropietarios === "function") {
        inicializarPropietarios(); // Activa la escucha del formulario de login
      }
    }
    else if (vista.includes("lista-propietarios")) {
      if (typeof cargarPropietarios === "function") {
        requestAnimationFrame(() => cargarPropietarios());
      }
    }
    // else if (vista.includes("lista-propietarios")) {
    //   if (typeof cargarPropietarios === "function") {
    //     requestAnimationFrame(() => cargarPropietarios());
    //   }
    // }
  } catch (error) {
    console.error("Error cargando la vista:", error);
    contenedor.innerHTML = "<p class='text-danger text-center mt-3'>Error al cargar el contenido.</p>";
  }
}

//Función para guardar Usuarios
function inicializarVistas() {
  const form = document.getElementById("registro");
  form.addEventListener("submit", function (e) {
    alert("¡Registro funcionando!");
    e.preventDefault();
    const contrasena = form.querySelector('input[name="contrasena"]').value;
    const confirmacion = form.querySelector('input[name="confirmacion"]').value;
    if (contrasena !== confirmacion) {
      alert("La confirmación de contraseña no coincide");
      return;
    }
    let formData = new FormData(form);
    // Debug: mostrar los datos en consola
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    // Enviar al backend
    fetch("http://127.0.0.1/vezinos_backend/vezinos/guardar.php", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "error") {
          alert(data.message); // muestra el error específico
        } else {
          alert(data.message); // muestra éxito
        }
      })
      .catch(err => {
        alert("Error en la conexión");
        console.log("Respuesta del backend:", data);
        const mensaje = document.getElementById("mensaje");
        if (mensaje) {
          mensaje.innerText = data.message;
        }
      })
      .catch(err => {
        console.error("Error en la conexión:", err);
        const mensaje = document.getElementById("mensaje");
        if (mensaje) {
          mensaje.innerText = "Error en la conexión";
        }
      });
  });
}

//Función para validar usuarios
function inicializarLogin() {
  const form = document.getElementById("ingresar");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let formData = new FormData(form);
      fetch("http://127.0.0.1/vezinos_backend/vezinos/login.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            const rol = formData.get("rol");
            if (rol === "Administrador") {
              window.location.href = "/template/index-admin.html";
            } else {
              alert("Login correcto, pero aún no tienes acceso a index-admin.html");
            }
          } else {
            alert(data.message);
          }
        })
        .catch(err => {
          alert("Error en la conexión del login");
        });
    });
  }
}

//Función para guardar datos de propietarios
function inicializarPropietarios() {
  const form = document.getElementById("propietario");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let formData = new FormData(form);

      fetch("http://127.0.0.1/vezinos_backend/vezinos/register_propietario.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          console.log("Respuesta JSON:", data);
          alert(data.message);
          // Limpia todos los inputs del formulario
          form.reset();
          // Refrescar la tabla de propietarios
          cargarPropietarios();
        })
        .catch(err => {
          console.error("Error en la conexión:", err);
          alert("Error en la conexión de propietarios");
        });
    });
  }
}

// Función para mostrar tabla de propietarios
function cargarPropietarios() {
  console.log("Se inició tabla");

  const contenedor = document.getElementById("contenido");
  const tbody = contenedor.querySelector("#tabla-propietarios");
  if (!tbody) {
    console.warn("No existe la tabla de propietarios en esta vista");
    return;
  }

  fetch("http://127.0.0.1/vezinos_backend/vezinos/listar_propietarios.php")
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = "";
      data.forEach(p => {
        const fila = `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.numero_cedula}</td>
            <td>${p.celular}</td>
            <td>${p.correo}</td>
            <td>${p.casa}</td>
            <td>
              <span class="badge ${p.residente === 'Si' ? 'bg-success' : 'bg-danger'}">
                ${p.residente}
              </span>
            </td>
            <td>
          <a href="#" class="btn-editar text-primary" data-id="${p.id}">
        <i class="fas fa-edit"></i>
      </a>
            </td>
          </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", fila);
      });
      document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const id = btn.dataset.id;
          console.log("ID enviado a editarPropietario:", id); // 👈 depuración
          editarPropietario(id);
        });
      });
    })
    .catch(err => console.error("Error cargando propietarios:", err));
}

//Funcion para editar el propietario
async function editarPropietario(id) {
  console.log("ID enviado:", id);

  try {
    const res = await fetch(`http://127.0.0.1/vezinos_backend/vezinos/buscar_propietario.php?id=${id}`);
    const propietario = await res.json();
    console.log("Propietario recibido:", propietario); // 👈 Depuración
    // Cargar la vista del formulario
    await cargarVista("formulario-propietario");

    // Rellenar campos después de que el formulario esté en el DOM
    setTimeout(() => {
      document.getElementById("nombre").value = propietario.nombre ?? "";
      document.getElementById("numero_cedula").value = propietario.numero_cedula ?? "";
      document.getElementById("celular").value = propietario.celular ?? "";
      document.getElementById("correo").value = propietario.correo ?? "";
      document.getElementById("torre_manzana").value = propietario.torre_manzana ?? "";
      document.getElementById("apartamento").value = propietario.apartamento ?? "";
      document.getElementById("residente").value = propietario.residente ?? "";
      document.getElementById("propietario_id").value = propietario.id; // campo oculto
    }, 100);
  } catch (err) {
    console.error("Error al editar propietario:", err);
  }
}


// Llamar la función al cargar la vista
document.addEventListener("DOMContentLoaded", cargarPropietarios);


// Función para inhabilitar input
document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "rol") {
    const input = document.getElementById("codigo");
    if (input) {
      input.disabled = (e.target.value === "porteria" || e.target.value === "residente");
    }
  }
});

function inicializarGraficos() {
  //Gráfico de barras
  const ctx2 = document.getElementById('graficoBarras').getContext('2d');
  const graficoBarras = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Manzana A', 'Manzana B', 'Manzana C'],
      datasets: [{
        label: 'Cantidad de residentes',
        data: [250, 200, 150],
        backgroundColor: ['#007bff', '#C0C0C0', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false // ocultar leyenda si no es necesaria
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de personas'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Torres o Manzanas'
          }
        }
      }
    }
  });

  const ctx3 = document.getElementById('graficoSexoEdad').getContext('2d');
  const graficoSexoEdad = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: ['Menores de edad', 'Mayores de edad'],
      datasets: [
        {
          label: 'Hombres',
          data: [25, 40], // Ejemplo: 25 menores, 40 mayores
          backgroundColor: '#007bff' // azul
        },
        {
          label: 'Mujeres',
          data: [30, 35], // Ejemplo: 30 menores, 35 mayores
          backgroundColor: '#ff69b4' // rosado
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Distribución por sexo y edad'
        }
      }
    }
  });

  const ctx = document.getElementById('miGraficoCircular').getContext('2d');
  const graficoCircularEdad = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Menores', 'Adultos', 'Adultos Mayores'],
      datasets: [{
        data: [120, 300, 80], // Ejemplo: 120 menores, 300 adultos, 80 adultos mayores
        backgroundColor: ['#007bff', '#dc3545', '#C0C0C0'] // azul, rojo, gris
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Distribución por edad'
        }
      }
    }
  });

  const ctx4 = document.getElementById('miGraficoArrendatarios').getContext('2d');
  const graficoCircularArrendatario = new Chart(ctx4, {
    type: 'pie',
    data: {
      labels: ['Arrendatarios', 'Propietarios'],
      datasets: [{
        data: [120, 300], // Ejemplo: 120 menores, 300 adultos, 80 adultos mayores
        backgroundColor: ['#007bff', '#dc3545',] // azul, rojo, gris
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Distribución por edad'
        }
      }
    }
  });

  // Función para abrir el modal
  var modal = new bootstrap.Modal(document.getElementById('modalCasa12'));
  modal.show();
  //prueba final 
}

