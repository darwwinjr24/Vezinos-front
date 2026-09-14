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
  cargarConjuntos();
  form.addEventListener("submit", function (e) {
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
    if (!formData.get("id_conjunto")) {
      alert("Debe seleccionar un conjunto");
      return;
    }
    // Enviar al backend
    fetch("http://127.0.0.1/vezinos_backend/vezinos/usuarios/guardar.php", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "error") {
          alert(data.message); // muestra el error específico
        } else {
          alert(data.message); // muestra éxito
          // Limpia todos los inputs del formulario
          form.reset();
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
      fetch("http://127.0.0.1/vezinos_backend/vezinos/usuarios/buscar.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            const rol = formData.get("rol").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            console.log("Rol recibido:", rol);

            if (rol === "administrador") {
              window.location.href = "modulo_administrador/index-admin.html";
            }
            else if (rol === "porteria") {
              window.location.href = "modulo_porteria/index_porteria.html";
            }
            else if (rol === "residente") {
              window.location.href = "modulo_residente/index_residente.html";
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
  buscarCedula()
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let formData = new FormData(form);

      fetch("http://127.0.0.1/vezinos_backend/vezinos/personas/guardar_editar.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          console.log("Respuesta JSON:", data);
          alert(data.message);
          // Limpia todos los inputs del formulario
          form.reset();
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

  fetch("http://127.0.0.1/vezinos_backend/vezinos/personas/ver.php")
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = "";
      let personas = data;

      if (filtroRol) {
        if (filtroRol.toLowerCase() === "propietario") {
          // 🔎 Filtrar por rol propietario
          personas = data.filter(p => p.perfil && p.perfil.toLowerCase() === "propietario");
        } else if (filtroRol.toLowerCase() === "arrendatario") {
          // 🔎 Filtrar por rol arrendatario Y residente = "Si"
          personas = data.filter(p =>
            p.residente && p.residente.trim().toLowerCase() === "si"
          );
        }
      }

      personas.forEach(p => {
        // Controlar que los valores nulos se muestren como texto vacío
        const nombre   = p.nombre_persona || '';
        const cedula   = p.numero_cedula || '';
        const celular  = p.celular || '';
        const correo   = p.correo_persona || '';
        const residente = p.residente || 'No';
        const perfil   = p.perfil || '';

        const fila = `
          <tr>
            <td>${nombre}</td>
            <td>${cedula}</td>
            <td>${celular}</td>
            <td>${correo}</td>
            <td>
              <span class="badge ${residente.toLowerCase() === 'si' ? 'bg-success' : 'bg-danger'}">
                ${residente}
              </span>
            </td>
            <td>${perfil}</td>
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

      // Asignar listeners para edición
      document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const id = btn.dataset.id_persona;
          console.log("ID enviado a editarPersonas:", id);
          editarPersonas(id);
        });
      });

      // Asignar listeners para eliminación
      document.querySelectorAll(".btn-borrar").forEach(btn => {
        btn.addEventListener("click", e => {
          e.preventDefault();
          const id = btn.dataset.id_persona;
          console.log("ID enviado a eliminarPersonas:", id);
          eliminarPersonas(id);
        });
      });
    })
    .catch(err => console.error("Error cargando personas:", err));
}

//Funcion para editar la persona
async function editarPersonas(id_persona) {
  console.log("ID enviado:", id_persona);
  try {
    const res = await fetch(`http://127.0.0.1/vezinos_backend/vezinos/personas/buscar.php?id_persona=${id_persona}`);
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
      document.getElementById("nombre_persona").value = persona.nombre_persona ?? "";
      document.getElementById("numero_cedula").value = persona.numero_cedula ?? "";
      document.getElementById("celular").value = persona.celular ?? "";
      document.getElementById("correo_persona").value = persona.correo_persona ?? "";
      // document.getElementById("torre_manzana").value = persona.torre_manzana ?? "";
      // document.getElementById("apartamento").value = persona.apartamento ?? "";
      document.getElementById("perfil").value = persona.perfil ?? "";
      document.getElementById("residente").value = persona.residente ?? "";
      document.getElementById("id_persona").value = persona.id_persona; // campo oculto
    }, 100);
  } catch (err) {
    console.error("Error al editar persona:", err);
  }
}

//Función para eliminar registro de personas
async function eliminarPersonas(id_persona) {
  if (!confirm("¿Seguro que deseas eliminar esta persona?")) return;

  try {
    const res = await fetch(`http://127.0.0.1/vezinos_backend/vezinos/personas/eliminar.php?id_persona=${id_persona}`, {
      method: "DELETE"
    });
    const data = await res.json();
    console.log(data);

    if (data.success) {
      alert("Persona eliminada correctamente");
      cargarPersonas()
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error("Error al eliminar persona:", err);
  }
}


//funcion para mostrar datos del conjunto en el select
// Llamada al PHP que devuelve JSON
function cargarConjuntos() {
  fetch('http://127.0.0.1/vezinos_backend/vezinos/conjuntos/buscar.php')
    .then(response => response.json())
    .then(data => {
      console.log("Datos recibidos del backend:", data); // 👈 imprime el array completo
      const select = document.getElementById('opcion-conjuntos');
      if (!select) {
        console.error("No se encontró el select con id='opcion-conjuntos'");
        return;
      }
      data.forEach(c => {
        console.log("Agregando opción:", c); // 👈 imprime cada objeto antes de insertarlo
        const option = document.createElement('option');
        option.value = c.id_conjunto;
        option.textContent = c.nombre_conjunto;
        select.appendChild(option);
      });
    })
    .catch(error => console.error('Error cargando conjuntos:', error));
};

//Función para buscar por cédula
// Función para buscar por cédula
function buscarCedula() {
  const cedulaInput = document.querySelector('input[name="numero_cedula"]');
  if (!cedulaInput) return;

  cedulaInput.addEventListener("blur", () => {
    const numeroCedula = cedulaInput.value.trim();

    // 1. Obtener referencias a los campos
    const inputNombre = document.querySelector('input[name="nombre_persona"]');
    const inputCorreo = document.querySelector('input[name="correo_persona"]');
    const inputIdUsuario = document.querySelector('input[name="id_usuario"]');

    // 2. LIMPIEZA PREVIA: Resetea id_usuario antes de hacer la petición
    if (inputIdUsuario) inputIdUsuario.value = "";

    // Si el campo de cédula está vacío, detiene la ejecución
    if (!numeroCedula) return;

    fetch("http://127.0.0.1/vezinos_backend/vezinos/personas/buscar_cedula.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "numero_cedula=" + encodeURIComponent(numeroCedula)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          // Si ES usuario: autocompleta los campos y asigna la FK
          if (inputNombre) inputNombre.value = data.data.nombre_completo;
          if (inputCorreo) inputCorreo.value = data.data.correo;
          if (inputIdUsuario) inputIdUsuario.value = data.data.id_usuario;
        } else {
          // Si NO es usuario: aseguras que id_usuario quede VACÍO y permites digitar manualmente
          if (inputIdUsuario) inputIdUsuario.value = "";
          if (inputNombre) inputNombre.value = "";
          if (inputCorreo) inputCorreo.value = "";

          alert(data.message);
        }
      })
      .catch(err => {
        console.error("Error en la conexión:", err);
        if (inputIdUsuario) inputIdUsuario.value = "";
      });
  });
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

