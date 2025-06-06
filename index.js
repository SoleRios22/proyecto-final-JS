let productosDisponibles = [];
let productosFiltrados = [];
const carrito = {};
const favoritos = new Set();

document.addEventListener('DOMContentLoaded', () => {
  cargarFavoritos();
  cargarCarrito();
  cargarProductos();
  configurarNavegacion();
});

function cargarProductos() {
  fetch('./productos.json')
    .then(res => res.json())
    .then(data => {
      productosDisponibles = data;
      productosFiltrados = [...productosDisponibles];
      generarCategorias();
      actualizarCarrito();
      mostrarProductos(productosDisponibles);
    })
    .catch(err => console.error("Error al cargar los productos:", err));
}

function mostrarProductos(lista, esCarrito = false) {
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
  verCarrito();
}

function finalizarCompra() {
  let mensaje = "Hola, quiero realizar la siguiente compra:%0A";
  let total = 0;
  for (const nombre in carrito) {
    const p = productosDisponibles.find(p => p.nombre === nombre);
    const cantidad = carrito[nombre];
    const subtotal = cantidad * p.precio;
    mensaje += `- ${nombre} x${cantidad} = $${subtotal.toFixed(2)}%0A`;
    total += subtotal;
  }
  mensaje += `%0ATotal: $${total.toFixed(2)}%0A%0AGracias!`;
  window.open(`https://wa.me/543584315332?text=${mensaje}`, '_blank');
}

function actualizarCarrito() {
  document.getElementById('cart-count').innerText = Object.values(carrito).reduce((a, b) => a + b, 0);
  guardarCarrito();
  document.getElementById('boton-carrito-cantidad').textContent = Object.values(carrito).reduce((a, b) => a + b, 0);

}

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function cargarCarrito() {
  const data = localStorage.getItem('carrito');
  if (data) Object.assign(carrito, JSON.parse(data));
}

function toggleFavorito(nombre) {
  favoritos.has(nombre) ? favoritos.delete(nombre) : favoritos.add(nombre);
  guardarFavoritos();
  mostrarProductos(productosFiltrados);
}

function guardarFavoritos() {
  localStorage.setItem('favoritos', JSON.stringify([...favoritos]));
}

function cargarFavoritos() {
  const data = localStorage.getItem('favoritos');
  if (data) JSON.parse(data).forEach(nombre => favoritos.add(nombre));
}


function filtrarProductos(categoria) {
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
    mostrarProductos(productosDisponibles);
  });

  document.getElementById('nav-favoritos').addEventListener('click', e => {
    e.preventDefault();
    verFavoritos();
  });

  document.getElementById('nav-carrito').addEventListener('click', e => {
    e.preventDefault();
    verCarrito();
  });

  const inputBuscador = document.getElementById('buscador');
  const btnLimpiar = document.getElementById('btn-limpiar');

  inputBuscador.addEventListener('input', () => {
    const texto = inputBuscador.value.toLowerCase();

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
  btnLimpiar.classList.add('d-none');
  mostrarProductos(productosFiltrados);
});

}

function verFavoritos() {
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


