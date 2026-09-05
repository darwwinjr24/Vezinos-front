console.log("✅ app.js activo y listo para probar");

// Función para mostrar vistas
async function cargarVista(vista, evento, filtroRol = null) {
  if (evento) evento.preventDefault();
  const contenedor = document.getElementById("contenido");
  try {
    const respuesta = await fetch(vista + ".html"); // Carga archivo externo
    if (!respuesta.ok) throw new Error("No se pudo encontrar la vista: " + vista);
    const html = await respuesta.text();
    contenedor.innerHTML = html;
    // --- EJECUCIÓN DE SCRIPTS SEGÚN LA VISTA ---
  if (vista === "graficos") {
      inicializarGraficos();
    }
    // Evaluamos si es la vista de registro (ya sea en raíz o subcarpeta)
    else if (vista.includes("registrar") || vista === "registro") {
      if (typeof inicializarVistas === "function") {
        inicializarVistas(); // Activa la escucha del botón de registro en app.js
      }
    }
    else if (vista.includes("ingresar")) {
      if (typeof inicializarLogin === "function") {
        inicializarLogin(); // Activa la escucha del formulario de login
      }
    }
    else if (vista.includes("formulario-propietario") || vista.includes("formulario-residente")) {
      if (typeof inicializarPersonas === "function") {
        inicializarPersonas(); // Activa la escucha del formulario de login
      }
    }
    else if (vista.includes("lista-propietarios")) {
      if (typeof cargarPersonas === "function") {
        requestAnimationFrame(() => cargarPersonas(filtroRol));
      }
    }
    //   else if (vista.includes("modulo-residente")) {
    //   if (typeof cargarPersonas === "function") {
    //     requestAnimationFrame(() => cargarPersonas(filtroRol));
    // }
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
    fetch("http://127.0.0.1/vezinos_backend/vezinos/usuarios.php", {
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
          const rol = formData.get("rol").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
          console.log("Rol recibido:", rol);
            
            if (rol === "administrador") {
              window.location.href = "/template/modulo_administrador/index-admin.html";
            }
            else if (rol === "porteria") {
              window.location.href = "/template/index_porteria.html";
            }
            else if (rol === "residente") {
              window.location.href = "/template/modulo-residente.html";
            } else {
              alert("Rol no reconocido");
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

//Función para guardar datos de personas
function inicializarPersonas() {
  const form = document.getElementById("personas");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let formData = new FormData(form);

      fetch("http://127.0.0.1/vezinos_backend/vezinos/personas.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          console.log("Respuesta JSON:", data);
          alert(data.message);
          // Limpia todos los inputs del formulario
          form.reset();
          // Refrescar la tabla de personas
          cargarPersonas();
        })
        .catch(err => {
          console.error("Error en la conexión:", err);
          alert("Error en la conexión de personas");
        });
    });
  }
}

// Función para mostrar tabla de personas
function cargarPersonas(filtroRol = null) {
  console.log("Se inició tabla");

  const contenedor = document.getElementById("contenido");
  const tbody = contenedor.querySelector("#tabla-personas");
  if (!tbody) {
    console.warn("No existe la tabla de personas en esta vista");
    return;
  }

  fetch("http://127.0.0.1/vezinos_backend/vezinos/mostrar_personas.php")
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = "";
      let personas = data;
      if (filtroRol) {
        if (filtroRol.toLowerCase() === "propietario") {
          // 🔎 Filtrar por rol propietario
          personas = data.filter(p => p.rol && p.rol.toLowerCase() === "propietario");
        } else if (filtroRol.toLowerCase() === "arrendatario") {
          // 🔎 Filtrar por rol arrendatario Y residente = "Si"
          personas = data.filter(p =>
            // p.rol && p.rol.trim().toLowerCase() === "arrendatario" 
            //&&
            p.residente && p.residente.trim().toLowerCase() === "si"
          );
        }
      }
      // personas = data.filter(p => p.rol && p.rol.toLowerCase() === filtroRol.toLowerCase());
      personas.forEach(p => {
        const fila = `
          <tr>
            <td>${p.nombre_completo}</td>
            <td>${p.numero_cedula}</td>
            <td>${p.celular}</td>
            <td>${p.correo}</td>
            <td>${p.casa}</td>

            <td>
              <span class="badge ${p.residente === 'Si' ? 'bg-success' : 'bg-danger'}">
                ${p.residente}
              </span>
            <td>${p.rol}</td>
            </td>
            <td class="text-center">
            <div class="d-inline-flex gap-4">
              <!-- Botón Editar -->
              <a href="#" class="btn-editar text-primary" data-id_persona="${p.id_persona}">
              <i class="fas fa-edit"></i>
              </a>
              <!-- Botón Borrar -->
              <a href="#" class="btn-borrar text-danger" data-id_persona="${p.id_persona}">
              <i class="fas fa-trash"></i>
              </a>
            </div>
            </td>
          </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", fila);
      });
      document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const id = btn.dataset.id_persona;
          console.log("ID enviado a editarPersona:", id); // 👈 depuración
          editarPersonas(id);
        });
      });
    })
    .catch(err => console.error("Error cargando personas:", err));
}

//Funcion para editar la persona
async function editarPersonas(id_persona) {
  console.log("ID enviado:", id_persona);

  try {
    const res = await fetch(`http://127.0.0.1/vezinos_backend/vezinos/buscar_personas.php?id_persona=${id_persona}`);
    const persona = await res.json();
    console.log("persona recibida:", persona); // 👈 Depuración
    // Cargar la vista del formulario
    if (persona.rol && persona.rol.toLowerCase() === "arrendatario") {
      await cargarVista("formulario-residente");
    } else {
      await cargarVista("formulario-propietario");
    }
    // Rellenar campos después de que el formulario esté en el DOM
    setTimeout(() => {
      document.getElementById("nombre_completo").value = persona.nombre_completo ?? "";
      document.getElementById("numero_cedula").value = persona.numero_cedula ?? "";
      document.getElementById("celular").value = persona.celular ?? "";
      document.getElementById("correo").value = persona.correo ?? "";
      document.getElementById("torre_manzana").value = persona.torre_manzana ?? "";
      document.getElementById("apartamento").value = persona.apartamento ?? "";
      document.getElementById("rol").value = persona.rol ?? "";
      document.getElementById("residente").value = persona.residente ?? "";
      document.getElementById("id_persona").value = persona.id_persona; // campo oculto
    }, 100);
  } catch (err) {
    console.error("Error al editar persona:", err);
  }
}


// Llamar la función al cargar la vista
document.addEventListener("DOMContentLoaded", cargarPersonas);


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
      labels: ['Arrendatarios', 'Personas'],
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

