let productosDisponibles = [];
let productosFiltrados = [];
const carrito = {};
const favoritos = new Set();
let vistaActual = 'todos'; // 'todos', 'favoritos', 'carrito', etc.


document.addEventListener('DOMContentLoaded', () => {
  try{
  cargarFavoritos();
  cargarCarrito();
  cargarProductos();
  configurarNavegacion();
  }catch(err){
    console.error("Error al cargar la aplicación:", err);
     Swal.fire({
      icon: 'error',
      title: 'Error al cargar la aplicación',
      text: 'No se pudieron cargar los productos. Intenta nuevamente más tarde.',
    });
  }
});


async function cargarProductos() {
  try {
    const res = await fetch('./productos.json');
    const data = await res.json();
    productosDisponibles = data;
    productosFiltrados = [...productosDisponibles];
    generarCategorias();
    actualizarCarrito();
    mostrarProductos(productosDisponibles);
  } catch (err) {
    console.error("Error al cargar los productos:", err);
    Swal.fire({
      icon: 'error',
      title: 'Error al cargar productos',
      text: 'No se pudieron cargar los productos. Intenta nuevamente más tarde.',
    });
  }
}


function mostrarProductos(lista, esCarrito = false) {
  if (!esCarrito) vistaActual = 'productos';
  const contenedor = document.getElementById('lista-productos');
  contenedor.innerHTML = '';

  if (!esCarrito) {
    lista.forEach(p => contenedor.appendChild(crearTarjetaProducto(p, esCarrito)));
  }

  document.getElementById('resumen-carrito').innerHTML = esCarrito ? mostrarResumenCarrito() : '';
}

function crearTarjetaProducto(p, esCarrito) {
  const card = document.createElement('div');
  card.className = "col-md-4";
  const esFavorito = favoritos.has(p.nombre);
  const cantidad = carrito[p.nombre] || 0;

  card.innerHTML = `
    <div class="card product-card">
      <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}">
      <div class="card-body">
        <h5 class="card-title">${p.nombre}</h5>
        <p class="card-text">${p.descripcion}</p>
        <p class="card-text"><strong>$${p.precio.toFixed(2)}</strong></p>
        <div class="input-group mb-2">
          <input type="number" min="1" value="1" id="cantidad-${p.nombre}" class="form-control">
          <button class="btn btn-outline-success" onclick="agregarAlCarrito('${p.nombre}')">Añadir</button>
        </div>
        <p id="cantidad-carrito-${p.nombre}">Cantidad en carrito: ${cantidad}</p>
        ${esCarrito ? `<button class="btn btn-sm btn-warning" onclick="eliminarDelCarrito('${p.nombre}')">Eliminar del carrito</button>` : ''}
        <button class="btn btn-sm ${esFavorito ? 'btn-danger' : 'btn-outline-danger'}" onclick="toggleFavorito('${p.nombre}')">
          ${esFavorito ? 'Quitar de favoritos' : '❤️ Favorito'}
        </button>
      </div>
    </div>`;
  return card;
}

function mostrarResumenCarrito() {
  let total = 0;
  let resumen = '<h4>Resumen del Carrito</h4><ul class="list-group">';
  for (const nombre in carrito) {
    const p = productosDisponibles.find(p => p.nombre === nombre);
    const cantidad = carrito[nombre];
    const subtotal = cantidad * p.precio;
    total += subtotal;
    resumen += `
      <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap">
        <div class="me-auto">
          <strong>${p.nombre}</strong><br>
          Cantidad: ${cantidad} | Subtotal: $${subtotal.toFixed(2)}
        </div>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-secondary" onclick="disminuirCantidad('${nombre}')">-</button>
          <button class="btn btn-sm btn-outline-success" onclick="incrementarCantidad('${nombre}')">+</button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarDelCarrito('${nombre}')">Eliminar</button>
        </div>
      </li>`;
  }

  resumen += `</ul>
    <h5 class="mt-3">Total: $${total.toFixed(2)}</h5>
    <div class="mt-3">
      <button class="btn btn-success me-2" onclick="finalizarCompra()">Finalizar compra</button>
      <button class="btn btn-danger" onclick="vaciarCarrito()">Vaciar carrito</button>
    </div>`;
  return resumen;
}

function agregarAlCarrito(nombre) {
  const input = document.getElementById(`cantidad-${nombre}`);
  const cantidad = parseInt(input.value);
  if (!isNaN(cantidad) && cantidad > 0) {
    carrito[nombre] = (carrito[nombre] || 0) + cantidad;
    actualizarCarrito();
    document.getElementById(`cantidad-carrito-${nombre}`).textContent = `Cantidad en carrito: ${carrito[nombre]}`;
  }
}

function incrementarCantidad(nombre) {
  carrito[nombre]++;
  actualizarCarrito();
  verCarrito();
}

function disminuirCantidad(nombre) {
  carrito[nombre] > 1 ? carrito[nombre]-- : delete carrito[nombre];
  actualizarCarrito();
  verCarrito();
}

function eliminarDelCarrito(nombre) {
  delete carrito[nombre];
  actualizarCarrito();
  verCarrito();
}

function vaciarCarrito() {
  for (const nombre in carrito) delete carrito[nombre];
  actualizarCarrito();
    vistaActual = 'carrito';
  verCarrito();
}

function finalizarCompra() {
   const modal = new bootstrap.Modal(document.getElementById('modalFinalizarCompra'),{backdrop:false});
  mostrarDetalleEnModal();
  modal.show();
  
}

function mostrarDetalleEnModal() {
  try{
  const detalle = document.getElementById('detalle-carrito');
  const carrito = JSON.parse(localStorage.getItem('carrito')) || {};
  const productos = productosDisponibles || [];

  let total = 0;
  let html = '<ul class="list-group mb-3">';
  for (const nombre in carrito) {
    const p = productos.find(prod => prod.nombre === nombre);
    const cantidad = carrito[nombre];
    const subtotal = p.precio * cantidad;
    total += subtotal;
    html += `<li class="list-group-item d-flex justify-content-between">
               <span>${p.nombre} x${cantidad}</span>
               <strong>$${subtotal.toFixed(2)}</strong>
             </li>`;
  }
  html += `</ul><p class="fw-bold">Total: $${total.toFixed(2)}</p>`;
  detalle.innerHTML = html;}
  catch(err){
     console.error("Error al mostrar el detalle del carrito:", err);
     Swal.fire({
      icon: 'error',
      title: 'Error al cargar detalle del carrito',
      text: 'No se pudo cargar el detalle del carrito. Intenta nuevamente más tarde.',
    });
  }
}



document.getElementById('form-finalizar-compra').addEventListener('submit', (e) => {
  e.preventDefault();
  try{

  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const telefono = document.getElementById('telefono').value;
  const metodoPago = document.getElementById('metodo-pago').value;
  const entrega = document.getElementById('entrega').value;
  const contacto = document.getElementById('contacto').value;
  const guardar = document.getElementById('guardar-carrito').checked;

  const carritoLS = JSON.parse(localStorage.getItem('carrito')) || {};
  const productos = productosDisponibles || [];

  let total = 0;
  let mensaje = `🛒 *Nuevo Pedido*\n`;
  mensaje += `👤 Nombre: ${nombre}\n📞 Teléfono: ${telefono}\n📧 Email: ${email}\n`;
  mensaje += `💳 Pago: ${metodoPago}\n🚚 Entrega: ${entrega}\n\n`;

  for (const nombre in carritoLS) {
    const prod = productos.find(p => p.nombre === nombre);
    const cantidad = carritoLS[nombre];
    const subtotal = cantidad * prod.precio;
    total += subtotal;
    mensaje += `• ${nombre} x${cantidad} = $${subtotal.toFixed(2)}\n`;
  }

  mensaje += `\n💰 *Total: $${total.toFixed(2)}*\n`;

  if (guardar) {
    localStorage.setItem('carritoGuardado', JSON.stringify(carritoLS));
  } else {
    localStorage.removeItem('carritoGuardado');
  }

  
Swal.fire({
  icon: 'success',
  title: 'Pedido realizado con éxito',
  text: 'Redirigiendo a tu aplicación de mensajería...',
  showConfirmButton: false,
  timer: 2500,
  willClose: () => {
    if (contacto === 'whatsapp') {
      const url = `https://wa.me/543584315332?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
    } else {
      const mailto = `mailto:tuemail@dominio.com?subject=Nuevo Pedido&body=${encodeURIComponent(mensaje)}`;
      window.open(mailto, '_blank');
    }
  }
});

  // Vaciar carrito y actualizar
  for (const nombre in carrito) delete carrito[nombre];
  actualizarCarrito();
  localStorage.removeItem('carrito'); // limpia también localStorage

  // Cerrar modal de compra y carrito
  const modalCompra = bootstrap.Modal.getInstance(document.getElementById('modalFinalizarCompra'));
  const modalCarrito = bootstrap.Modal.getInstance(document.getElementById('modalCarrito'));
  if (modalCompra) modalCompra.hide();
  if (modalCarrito) modalCarrito.hide();

  mostrarProductos(productosFiltrados);

  // Limpiar formulario
  document.getElementById('nombre').value = '';
  document.getElementById('email').value = '';
  document.getElementById('telefono').value = '';
  document.getElementById('metodo-pago').selectedIndex = 0;
  document.getElementById('entrega').selectedIndex = 0;
  document.getElementById('contacto').selectedIndex = 0;
  document.getElementById('guardar-carrito').checked = false;
  }catch(err){
    console.error("Error al procesar la compra:", err);
    Swal.fire({
      icon: 'error',
      title: 'Error en el pedido',
      text: 'Hubo un problema al finalizar la compra. Por favor, revisa los datos e intenta nuevamente.',
    });
  } 
});

function actualizarCarrito() {
  document.getElementById('cart-count').innerText = Object.values(carrito).reduce((a, b) => a + b, 0);
  guardarCarrito();
  document.getElementById('boton-carrito-cantidad').textContent = Object.values(carrito).reduce((a, b) => a + b, 0);

}

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}


function cargarCarrito() {
  try {
    const data = localStorage.getItem('carrito');
    if (data) Object.assign(carrito, JSON.parse(data));
  } catch (err) {
    console.error("Error al cargar el carrito:", err);
    Swal.fire({
      icon: 'warning',
      title: 'Problema con el carrito',
      text: 'No se pudo cargar el carrito guardado correctamente.',
    });
  }
}


function toggleFavorito(nombre) {
  if (favoritos.has(nombre)) {
    favoritos.delete(nombre);
  } else {
    favoritos.add(nombre);
  }
  guardarFavoritos();

  // Refrescar la vista correspondiente
 switch (vistaActual) {
    case 'favoritos':
      verFavoritos();
      break;
    case 'categoria':
    case 'busqueda':
    case 'todos':
    case 'productos':
      mostrarProductos(productosFiltrados);
      break;
    default:
      mostrarProductos(productosDisponibles);
  }
}


function guardarFavoritos() {
  localStorage.setItem('favoritos', JSON.stringify([...favoritos]));
}

function cargarFavoritos() {
  try {
  const data = localStorage.getItem('favoritos');
  if (data) JSON.parse(data).forEach(nombre => favoritos.add(nombre));
  }catch(err){
    console.error("Error al cargar los favoritos:", err);
     Swal.fire({
      icon: 'error',
      title: 'Error al cargar favorito',
      text: 'No se pudieron cargar los productos favoritos. Intenta nuevamente más tarde.',
    });
  }
}


function filtrarProductos(categoria) {
    vistaActual = 'categoria';
  productosFiltrados = categoria ? productosDisponibles.filter(p => p.categoria === categoria) : [...productosDisponibles];
  mostrarProductos(productosFiltrados);
}

function generarCategorias() {
  const categorias = [...new Set(productosDisponibles.map(p => p.categoria))];
  const contenedor = document.getElementById('categorias');
  contenedor.innerHTML = '';

  const btnTodos = crearBotonCategoria('Todos', null, true);
  contenedor.appendChild(btnTodos);

  categorias.forEach(cat => contenedor.appendChild(
    crearBotonCategoria(cat.charAt(0).toUpperCase() + cat.slice(1), cat)
  ));
}

function crearBotonCategoria(texto, categoria, activo = false) {
  const btn = document.createElement('button');
  btn.className = `btn btn-outline-primary categoria-btn ${activo ? 'active' : ''}`;
  btn.textContent = texto;
  btn.onclick = () => {
    filtrarProductos(categoria);
    marcarCategoriaSeleccionada(btn);
  };
  return btn;
}

function marcarCategoriaSeleccionada(boton) {
  document.querySelectorAll('.categoria-btn').forEach(btn => btn.classList.remove('active'));
  boton.classList.add('active');
}

function configurarNavegacion() {
  document.getElementById('nav-inicio').addEventListener('click', e => {
    e.preventDefault();
     vistaActual = 'todos';
    mostrarProductos(productosDisponibles);
  });

  document.getElementById('nav-favoritos').addEventListener('click', e => {
    e.preventDefault();
      vistaActual = 'favoritos';
    verFavoritos();
  });

  document.getElementById('nav-carrito').addEventListener('click', e => {
    e.preventDefault();
     vistaActual = 'carrito';
    verCarrito();
  });

  const inputBuscador = document.getElementById('buscador');
  const btnLimpiar = document.getElementById('btn-limpiar');

  inputBuscador.addEventListener('input', () => {
    const texto = inputBuscador.value.toLowerCase();
      vistaActual = 'busqueda';

  // Mostrar u ocultar el botón de limpiar
    if (texto.length > 0) {
      btnLimpiar.classList.remove('d-none');
    } else {
      btnLimpiar.classList.add('d-none');
    }

    const resultado = productosFiltrados.filter(p =>
      p.nombre.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto)
    );
    mostrarProductos(resultado);
});

btnLimpiar.addEventListener('click', () => {
  inputBuscador.value = '';
    vistaActual = 'todos';
  btnLimpiar.classList.add('d-none');
  mostrarProductos(productosFiltrados);
});

document.getElementById('nav-carrito-guardado').addEventListener('click', e => {
  e.preventDefault();
  mostrarCarritoGuardado();
});

function mostrarCarritoGuardado() {
  const guardado = JSON.parse(localStorage.getItem('carritoGuardado'));
  const contenedor = document.getElementById('contenido-carrito-guardado');

  if (!guardado || Object.keys(guardado).length === 0) {
    contenedor.innerHTML = '<p class="text-muted">No hay ningún carrito guardado.</p>';
    document.getElementById('btn-restaurar-carrito').disabled = true;
    document.getElementById('btn-eliminar-carrito-guardado').disabled = true;
  } else {
    let total = 0;
    let html = '<ul class="list-group">';
    for (const nombre in guardado) {
      const prod = productosDisponibles.find(p => p.nombre === nombre);
      const cantidad = guardado[nombre];
      const subtotal = cantidad * prod.precio;
      total += subtotal;
      html += `<li class="list-group-item d-flex justify-content-between">
        <div><strong>${nombre}</strong><br>Cantidad: ${cantidad} | Subtotal: $${subtotal.toFixed(2)}</div>
      </li>`;
    }
    html += `</ul><p class="mt-3"><strong>Total: $${total.toFixed(2)}</strong></p>`;
    contenedor.innerHTML = html;
    document.getElementById('btn-restaurar-carrito').disabled = false;
    document.getElementById('btn-eliminar-carrito-guardado').disabled = false;
  }

  new bootstrap.Modal(document.getElementById('modalCarritoGuardado'),{backdrop:false}).show();
}


document.getElementById('btn-restaurar-carrito').addEventListener('click', () => {
  const guardado = JSON.parse(localStorage.getItem('carritoGuardado'));
  if (!guardado) return;

  Swal.fire({
    title: '¿Reemplazar carrito actual?',
    text: 'Esto eliminará los productos actuales y restaurará el carrito guardado.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, reemplazar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then(result => {
    if (result.isConfirmed) {
      for (const nombre in carrito) delete carrito[nombre];
      Object.assign(carrito, guardado);
      actualizarCarrito();
      mostrarProductos(productosFiltrados);
      bootstrap.Modal.getInstance(document.getElementById('modalCarritoGuardado')).hide();

      Swal.fire({
        title: 'Carrito restaurado',
        text: 'Tu carrito fue restaurado con éxito.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  });
});


document.getElementById('btn-eliminar-carrito-guardado').addEventListener('click', () => {
  localStorage.removeItem('carritoGuardado');
  mostrarCarritoGuardado(); // refresca el contenido del modal
});

}

function verFavoritos() {
  vistaActual = 'favoritos';
  mostrarProductos(productosDisponibles.filter(p => favoritos.has(p.nombre)));
}

 function verCarrito() {
  const contenido = document.getElementById('contenido-modal-carrito');
  contenido.innerHTML = mostrarResumenCarrito();

  const modalElement = document.getElementById('modalCarrito');
  const modal = new bootstrap.Modal(modalElement, {
    backdrop: false
  });

  modal.show();

  modalElement.addEventListener('hidden.bs.modal', () => {
    actualizarCarrito();
    mostrarProductos(productosFiltrados); 
  }, { once: true });
}

document.getElementById('boton-carrito').addEventListener('click', verCarrito);

