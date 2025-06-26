// URLs base de la API
const API_BASE_URL = "http://localhost:8000"; // Cambia esto si tu backend no está en localhost:8000

// ====================================================================================================
// --- FUNCIONES UTILITARIAS GENERALES ---
// ====================================================================================================

/**
 * Función genérica para realizar llamadas a la API.
 * @param {string} url - La URL del endpoint de la API.
 * @param {string} method - El método HTTP (GET, POST, PUT, PATCH, DELETE).
 * @param {object} [data=null] - Los datos a enviar en el cuerpo de la solicitud.
 * @returns {Promise<object>} - Una promesa que resuelve con los datos de la respuesta JSON.
 */
async function apiCall(url, method, data = null) {
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.detail || `Error ${response.status}: ${response.statusText}`);
        }
        // DELETE requests might not return JSON
        if (response.status === 204) {
            return null; // No content
        }
        return await response.json();
    } catch (error) {
        console.error(`API Call Error (${method} ${url}):`, error);
        alert(`Error: ${error.message}`);
        throw error; // Propagate error for specific handling
    }
}

/**
 * Establece los valores de un formulario para edición.
 * @param {HTMLElement} form - El elemento del formulario.
 * @param {object} data - Los datos para poblar el formulario.
 * @param {string} idField - El nombre del campo de ID en el HTML (ej. 'clienteId').
 * @param {string} submitBtnId - El ID del botón de submit.
 * @param {string} cancelBtnId - El ID del botón de cancelar.
 * @param {string} entityName - Nombre de la entidad para el botón de submit (ej. 'Cliente').
 */
function setFormForEdit(form, data, idField, submitBtnId, cancelBtnId, entityName) {
    form.querySelector(`#${idField}`).value = data[`id_${entityName.toLowerCase()}`] || data.id_usuario || data.id_producto || data.id_venta; // Maneja diferentes ID fields
    for (const key in data) {
        const input = form.querySelector(`#${entityName.toLowerCase()}${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = data[key];
            } else if (input.type === 'datetime-local') {
                input.value = data[key] ? new Date(data[key]).toISOString().slice(0, 16) : '';
            } else if (input.tagName === 'SELECT' && key.startsWith('id_')) {
                // Para IDs de relaciones (ej. id_categoria, id_proveedor, id_cliente, id_usuario)
                input.value = data[key];
            } else {
                input.value = data[key];
            }
        }
    }
    document.getElementById(submitBtnId).textContent = `Actualizar ${entityName}`;
    document.getElementById(cancelBtnId).style.display = 'inline-block';
}

/**
 * Restablece el formulario después de una creación o edición.
 * @param {HTMLElement} form - El elemento del formulario.
 * @param {string} idField - El nombre del campo de ID en el HTML.
 * @param {string} submitBtnId - El ID del botón de submit.
 * @param {string} cancelBtnId - El ID del botón de cancelar.
 * @param {string} entityName - Nombre de la entidad para el botón de submit.
 */
function resetForm(form, idField, submitBtnId, cancelBtnId, entityName) {
    form.reset();
    form.querySelector(`#${idField}`).value = "";
    document.getElementById(submitBtnId).textContent = `Agregar ${entityName}`;
    document.getElementById(cancelBtnId).style.display = 'none';
    // Restablecer checkboxes a checked por defecto si aplica
    const activeCheckbox = form.querySelector(`#${entityName.toLowerCase()}Activo`);
    if (activeCheckbox) activeCheckbox.checked = true;

    // Para productos y ventas, si tienen selects, restablecer a la primera opción
    const productCategorySelect = form.querySelector('#productoCategoriaId');
    if (productCategorySelect) productCategorySelect.value = '';
    const productProveedorSelect = form.querySelector('#productoProveedorId');
    if (productProveedorSelect) productProveedorSelect.value = '';

    // Restablecer detalles de venta
    if (entityName === 'Venta') {
        document.getElementById('ventaDetallesContainer').innerHTML = '';
        addDetalleVentaRow(); // Añade la primera fila de detalle de venta
        document.getElementById('stockWarning').style.display = 'none';
    }
}


// ====================================================================================================
// --- GESTIÓN DE PESTAÑAS (TABS) ---
// ====================================================================================================

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab;

        // Remover 'active' de todos los botones y paneles
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        // Añadir 'active' al botón y panel clickeado
        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');

        // Cargar los datos de la pestaña activa
        switch (tabId) {
            case 'clientes':
                cargarClientes();
                break;
            case 'proveedores':
                cargarProveedores();
                break;
            case 'usuarios':
                cargarUsuarios();
                break;
            case 'categorias':
                cargarCategorias();
                break;
            case 'productos':
                cargarCategorias().then(() => cargarProveedores().then(() => cargarProductos())); // Carga dependencias antes
                break;
            case 'ventas':
                cargarClientes().then(() => cargarUsuarios().then(() => cargarProductosForVentas().then(() => cargarVentas())));
                break;
        }
    });
});


// ====================================================================================================
// --- CLIENTES ---
// ====================================================================================================

const clientesApiUrl = `${API_BASE_URL}/clientes/`;
const clienteForm = document.getElementById("clienteForm");
const clientesContainer = document.getElementById("clientesContainer");
const clienteIdInput = document.getElementById("clienteId");
const submitClienteBtn = document.getElementById("submitClienteBtn");
const cancelClienteEditBtn = document.getElementById("cancelClienteEdit");

clienteForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = clienteIdInput.value;
    const data = {
        nombre: document.getElementById("clienteNombre").value,
        correo: document.getElementById("clienteCorreo").value,
        telefono: document.getElementById("clienteTelefono").value || null,
        direccion: document.getElementById("clienteDireccion").value || null,
        activo: document.getElementById("clienteActivo").checked,
    };

    if (id) { // Editar (PATCH)
        await apiCall(`${clientesApiUrl}${id}`, "PATCH", data);
    } else { // Crear (POST)
        await apiCall(clientesApiUrl, "POST", data);
    }
    resetForm(clienteForm, 'clienteId', 'submitClienteBtn', 'cancelClienteEdit', 'Cliente');
    cargarClientes();
});

cancelClienteEditBtn.addEventListener("click", () => {
    resetForm(clienteForm, 'clienteId', 'submitClienteBtn', 'cancelClienteEdit', 'Cliente');
});

async function cargarClientes() {
    const clientes = await apiCall(clientesApiUrl, "GET");
    clientesContainer.innerHTML = "";
    clientes.forEach(cliente => {
        const div = document.createElement("div");
        div.classList.add("list-item");
        div.innerHTML = `
            <strong>ID: ${cliente.id_cliente} - ${cliente.nombre}</strong>
            <span>Correo: ${cliente.correo}</span>
            <span>Teléfono: ${cliente.telefono || 'N/A'}</span>
            <span>Dirección: ${cliente.direccion || 'N/A'}</span>
            <span>Activo: ${cliente.activo ? 'Sí' : 'No'}</span>
            <div class="acciones">
                <button onclick="editarCliente(${cliente.id_cliente}, '${cliente.nombre.replace(/'/g, "\\'")}', '${cliente.correo.replace(/'/g, "\\'")}', '${cliente.telefono ? cliente.telefono.replace(/'/g, "\\'") : ''}', '${cliente.direccion ? cliente.direccion.replace(/'/g, "\\'") : ''}', ${cliente.activo})">Editar</button>
                <button class="delete" onclick="eliminarCliente(${cliente.id_cliente})">Eliminar</button>
            </div>
        `;
        clientesContainer.appendChild(div);
    });
}

async function eliminarCliente(id) {
    if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;
    await apiCall(`${clientesApiUrl}${id}`, "DELETE");
    cargarClientes();
}

function editarCliente(id, nombre, correo, telefono, direccion, activo) {
    const data = { id_cliente: id, nombre, correo, telefono, direccion, activo };
    setFormForEdit(clienteForm, data, 'clienteId', 'submitClienteBtn', 'cancelClienteEdit', 'Cliente');
    document.getElementById("clienteNombre").value = nombre;
    document.getElementById("clienteCorreo").value = correo;
    document.getElementById("clienteTelefono").value = telefono;
    document.getElementById("clienteDireccion").value = direccion;
    document.getElementById("clienteActivo").checked = activo;
}


// ====================================================================================================
// --- PROVEEDORES ---
// ====================================================================================================

const proveedoresApiUrl = `${API_BASE_URL}/proveedores/`;
const proveedorForm = document.getElementById("proveedorForm");
const proveedoresContainer = document.getElementById("proveedoresContainer");
const proveedorIdInput = document.getElementById("proveedorId");
const submitProveedorBtn = document.getElementById("submitProveedorBtn");
const cancelProveedorEditBtn = document.getElementById("cancelProveedorEdit");

proveedorForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = proveedorIdInput.value;
    const data = {
        nombre: document.getElementById("proveedorNombre").value,
        correo: document.getElementById("proveedorCorreo").value,
        telefono: document.getElementById("proveedorTelefono").value || null,
        direccion: document.getElementById("proveedorDireccion").value || null,
        activo: document.getElementById("proveedorActivo").checked,
    };

    if (id) { // Editar (PATCH)
        await apiCall(`${proveedoresApiUrl}${id}`, "PATCH", data);
    } else { // Crear (POST)
        await apiCall(proveedoresApiUrl, "POST", data);
    }
    resetForm(proveedorForm, 'proveedorId', 'submitProveedorBtn', 'cancelProveedorEdit', 'Proveedor');
    cargarProveedores();
});

cancelProveedorEditBtn.addEventListener("click", () => {
    resetForm(proveedorForm, 'proveedorId', 'submitProveedorBtn', 'cancelProveedorEdit', 'Proveedor');
});

async function cargarProveedores() {
    const proveedores = await apiCall(proveedoresApiUrl, "GET");
    proveedoresContainer.innerHTML = "";
    proveedores.forEach(proveedor => {
        const div = document.createElement("div");
        div.classList.add("list-item");
        div.innerHTML = `
            <strong>ID: ${proveedor.id_proveedor} - ${proveedor.nombre}</strong>
            <span>Correo: ${proveedor.correo}</span>
            <span>Teléfono: ${proveedor.telefono || 'N/A'}</span>
            <span>Dirección: ${proveedor.direccion || 'N/A'}</span>
            <span>Activo: ${proveedor.activo ? 'Sí' : 'No'}</span>
            <div class="acciones">
                <button onclick="editarProveedor(${proveedor.id_proveedor}, '${proveedor.nombre.replace(/'/g, "\\'")}', '${proveedor.correo.replace(/'/g, "\\'")}', '${proveedor.telefono ? proveedor.telefono.replace(/'/g, "\\'") : ''}', '${proveedor.direccion ? proveedor.direccion.replace(/'/g, "\\'") : ''}', ${proveedor.activo})">Editar</button>
                <button class="delete" onclick="eliminarProveedor(${proveedor.id_proveedor})">Eliminar</button>
            </div>
        `;
        proveedoresContainer.appendChild(div);
    });
}

async function eliminarProveedor(id) {
    if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return;
    await apiCall(`${proveedoresApiUrl}${id}`, "DELETE");
    cargarProveedores();
}

function editarProveedor(id, nombre, correo, telefono, direccion, activo) {
    const data = { id_proveedor: id, nombre, correo, telefono, direccion, activo };
    setFormForEdit(proveedorForm, data, 'proveedorId', 'submitProveedorBtn', 'cancelProveedorEdit', 'Proveedor');
    document.getElementById("proveedorNombre").value = nombre;
    document.getElementById("proveedorCorreo").value = correo;
    document.getElementById("proveedorTelefono").value = telefono;
    document.getElementById("proveedorDireccion").value = direccion;
    document.getElementById("proveedorActivo").checked = activo;
}


// ====================================================================================================
// --- USUARIOS ---
// ====================================================================================================

const usuariosApiUrl = `${API_BASE_URL}/usuarios/`;
const usuarioForm = document.getElementById("usuarioForm");
const usuariosContainer = document.getElementById("usuariosContainer");
const usuarioIdInput = document.getElementById("usuarioId");
const submitUsuarioBtn = document.getElementById("submitUsuarioBtn");
const cancelUsuarioEditBtn = document.getElementById("cancelUsuarioEdit");

usuarioForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = usuarioIdInput.value;
    const data = {
        nombre_usuario: document.getElementById("usuarioNombreUsuario").value,
        nombre_completo: document.getElementById("usuarioNombreCompleto").value,
        correo: document.getElementById("usuarioCorreo").value,
        rol: document.getElementById("usuarioRol").value,
        activo: document.getElementById("usuarioActivo").checked,
    };
    const password = document.getElementById("usuarioContraseña").value;
    if (password) { // Solo incluir contraseña si se ha modificado o es un nuevo usuario
        data.contraseña = password;
    }

    if (id) { // Editar (PATCH)
        await apiCall(`${usuariosApiUrl}${id}`, "PATCH", data);
    } else { // Crear (POST)
        if (!password) {
            alert("La contraseña es obligatoria para nuevos usuarios.");
            return;
        }
        await apiCall(usuariosApiUrl, "POST", data);
    }
    resetForm(usuarioForm, 'usuarioId', 'submitUsuarioBtn', 'cancelUsuarioEdit', 'Usuario');
    document.getElementById("usuarioContraseña").value = ""; // Limpiar contraseña explícitamente
    cargarUsuarios();
});

cancelUsuarioEditBtn.addEventListener("click", () => {
    resetForm(usuarioForm, 'usuarioId', 'submitUsuarioBtn', 'cancelUsuarioEdit', 'Usuario');
    document.getElementById("usuarioContraseña").value = "";
});

async function cargarUsuarios() {
    const usuarios = await apiCall(usuariosApiUrl, "GET");
    usuariosContainer.innerHTML = "";
    usuarios.forEach(usuario => {
        const div = document.createElement("div");
        div.classList.add("list-item");
        div.innerHTML = `
            <strong>ID: ${usuario.id_usuario} - ${usuario.nombre_usuario}</strong>
            <span>Nombre Completo: ${usuario.nombre_completo}</span>
            <span>Correo: ${usuario.correo}</span>
            <span>Rol: ${usuario.rol}</span>
            <span>Activo: ${usuario.activo ? 'Sí' : 'No'}</span>
            <div class="acciones">
                <button onclick="editarUsuario(${usuario.id_usuario}, '${usuario.nombre_usuario.replace(/'/g, "\\'")}', '${usuario.nombre_completo.replace(/'/g, "\\'")}', '${usuario.correo.replace(/'/g, "\\'")}', '${usuario.rol}', ${usuario.activo})">Editar</button>
                <button class="delete" onclick="eliminarUsuario(${usuario.id_usuario})">Eliminar</button>
            </div>
        `;
        usuariosContainer.appendChild(div);
    });
}

async function eliminarUsuario(id) {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    await apiCall(`${usuariosApiUrl}${id}`, "DELETE");
    cargarUsuarios();
}

function editarUsuario(id, nombreUsuario, nombreCompleto, correo, rol, activo) {
    const data = { id_usuario: id, nombre_usuario: nombreUsuario, nombre_completo: nombreCompleto, correo, rol, activo };
    setFormForEdit(usuarioForm, data, 'usuarioId', 'submitUsuarioBtn', 'cancelUsuarioEdit', 'Usuario');
    // No precargar la contraseña por seguridad
    document.getElementById("usuarioContraseña").value = "";
    document.getElementById("usuarioNombreUsuario").value = nombreUsuario;
    document.getElementById("usuarioNombreCompleto").value = nombreCompleto;
    document.getElementById("usuarioCorreo").value = correo;
    document.getElementById("usuarioRol").value = rol;
    document.getElementById("usuarioActivo").checked = activo;
}


// ====================================================================================================
// --- CATEGORIAS ---
// ====================================================================================================

const categoriasApiUrl = `${API_BASE_URL}/categorias/`;
const categoriaForm = document.getElementById("categoriaForm");
const categoriasContainer = document.getElementById("categoriasContainer");
const categoriaIdInput = document.getElementById("categoriaId");
const submitCategoriaBtn = document.getElementById("submitCategoriaBtn");
const cancelCategoriaEditBtn = document.getElementById("cancelCategoriaEdit");

categoriaForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = categoriaIdInput.value;
    const data = {
        nombre_categoria: document.getElementById("categoriaNombre").value,
        descripcion_categoria: document.getElementById("categoriaDescripcion").value || null,
    };

    if (id) { // Editar (PATCH)
        await apiCall(`${categoriasApiUrl}${id}`, "PATCH", data);
    } else { // Crear (POST)
        await apiCall(categoriasApiUrl, "POST", data);
    }
    resetForm(categoriaForm, 'categoriaId', 'submitCategoriaBtn', 'cancelCategoriaEdit', 'Categoría');
    cargarCategorias();
});

cancelCategoriaEditBtn.addEventListener("click", () => {
    resetForm(categoriaForm, 'categoriaId', 'submitCategoriaBtn', 'cancelCategoriaEdit', 'Categoría');
});

async function cargarCategorias() {
    const categorias = await apiCall(categoriasApiUrl, "GET");
    categoriasContainer.innerHTML = "";
    const categoriaSelects = document.querySelectorAll('#productoCategoriaId, #productoCategoriaId_venta'); // También para productos/ventas
    
    categoriaSelects.forEach(select => {
        select.innerHTML = '<option value="">Selecciona Categoría</option>';
    });

    categorias.forEach(categoria => {
        const div = document.createElement("div");
        div.classList.add("list-item");
        div.innerHTML = `
            <strong>ID: ${categoria.id_categoria} - ${categoria.nombre_categoria}</strong>
            <span>Descripción: ${categoria.descripcion_categoria || 'N/A'}</span>
            <div class="acciones">
                <button onclick="editarCategoria(${categoria.id_categoria}, '${categoria.nombre_categoria.replace(/'/g, "\\'")}', '${categoria.descripcion_categoria ? categoria.descripcion_categoria.replace(/'/g, "\\'") : ''}')">Editar</button>
                <button class="delete" onclick="eliminarCategoria(${categoria.id_categoria})">Eliminar</button>
            </div>
        `;
        categoriasContainer.appendChild(div);

        // Llenar selects para productos
        categoriaSelects.forEach(select => {
            const option = document.createElement("option");
            option.value = categoria.id_categoria;
            option.textContent = categoria.nombre_categoria;
            select.appendChild(option);
        });
    });
    return categorias; // Retorna las categorías para encadenar promesas
}

async function eliminarCategoria(id) {
    if (!confirm("¿Seguro que deseas eliminar esta categoría? Esto podría afectar a los productos asociados.")) return;
    await apiCall(`${categoriasApiUrl}${id}`, "DELETE");
    cargarCategorias();
    cargarProductos(); // Recargar productos por si la categoría eliminada los afectó
}

function editarCategoria(id, nombreCategoria, descripcionCategoria) {
    const data = { id_categoria: id, nombre_categoria: nombreCategoria, descripcion_categoria: descripcionCategoria };
    setFormForEdit(categoriaForm, data, 'categoriaId', 'submitCategoriaBtn', 'cancelCategoriaEdit', 'Categoría');
    document.getElementById("categoriaNombre").value = nombreCategoria;
    document.getElementById("categoriaDescripcion").value = descripcionCategoria;
}


// ====================================================================================================
// --- PRODUCTOS ---
// ====================================================================================================

const productosApiUrl = `${API_BASE_URL}/productos/`;
const productoForm = document.getElementById("productoForm");
const productosContainer = document.getElementById("productosContainer");
const productoIdInput = document.getElementById("productoId");
const submitProductoBtn = document.getElementById("submitProductoBtn");
const cancelProductoEditBtn = document.getElementById("cancelProductoEdit");
let allProductsData = []; // Para almacenar todos los productos con sus detalles

productoForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = productoIdInput.value;
    const data = {
        nombre_producto: document.getElementById("productoNombre").value,
        descripcion_producto: document.getElementById("productoDescripcion").value || null,
        precio_compra: parseFloat(document.getElementById("productoPrecioCompra").value),
        precio_venta: parseFloat(document.getElementById("productoPrecioVenta").value),
        existencias: parseInt(document.getElementById("productoExistencias").value),
        id_categoria: parseInt(document.getElementById("productoCategoriaId").value),
        id_proveedor: parseInt(document.getElementById("productoProveedorId").value),
        activo: document.getElementById("productoActivo").checked,
    };

    if (id) { // Editar (PATCH)
        await apiCall(`${productosApiUrl}${id}`, "PATCH", data);
    } else { // Crear (POST)
        await apiCall(productosApiUrl, "POST", data);
    }
    resetForm(productoForm, 'productoId', 'submitProductoBtn', 'cancelProductoEdit', 'Producto');
    cargarProductos();
    cargarProductosForVentas(); // Para asegurar que los productos en las ventas estén actualizados
});

cancelProductoEditBtn.addEventListener("click", () => {
    resetForm(productoForm, 'productoId', 'submitProductoBtn', 'cancelProductoEdit', 'Producto');
});

async function cargarProductos() {
    const productos = await apiCall(productosApiUrl, "GET");
    allProductsData = productos; // Almacenar para uso en ventas
    productosContainer.innerHTML = "";
    productos.forEach(producto => {
        const div = document.createElement("div");
        div.classList.add("list-item");
        div.innerHTML = `
            <strong>ID: ${producto.id_producto} - ${producto.nombre_producto}</strong>
            <span>Descripción: ${producto.descripcion_producto || 'N/A'}</span>
            <span>Precio Compra: $${producto.precio_compra.toFixed(2)}</span>
            <span>Precio Venta: $${producto.precio_venta.toFixed(2)}</span>
            <span>Existencias: ${producto.existencias}</span>
            <span>Categoría: ${producto.categoria ? producto.categoria.nombre_categoria : 'N/A'}</span>
            <span>Proveedor: ${producto.proveedor ? producto.proveedor.nombre : 'N/A'}</span>
            <span>Activo: ${producto.activo ? 'Sí' : 'No'}</span>
            <div class="acciones">
                <button onclick="editarProducto(${producto.id_producto}, '${producto.nombre_producto.replace(/'/g, "\\'")}', '${producto.descripcion_producto ? producto.descripcion_producto.replace(/'/g, "\\'") : ''}', ${producto.precio_compra}, ${producto.precio_venta}, ${producto.existencias}, ${producto.id_categoria}, ${producto.id_proveedor}, ${producto.activo})">Editar</button>
                <button class="delete" onclick="eliminarProducto(${producto.id_producto})">Eliminar</button>
            </div>
        `;
        productosContainer.appendChild(div);
    });
}

async function eliminarProducto(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    await apiCall(`${productosApiUrl}${id}`, "DELETE");
    cargarProductos();
    cargarProductosForVentas();
}

function editarProducto(id, nombre, descripcion, precioCompra, precioVenta, existencias, idCategoria, idProveedor, activo) {
    const data = { 
        id_producto: id, nombre_producto: nombre, descripcion_producto: descripcion, 
        precio_compra: precioCompra, precio_venta: precioVenta, existencias, 
        id_categoria: idCategoria, id_proveedor: idProveedor, activo 
    };
    setFormForEdit(productoForm, data, 'productoId', 'submitProductoBtn', 'cancelProductoEdit', 'Producto');
    document.getElementById("productoNombre").value = nombre;
    document.getElementById("productoDescripcion").value = descripcion;
    document.getElementById("productoPrecioCompra").value = precioCompra;
    document.getElementById("productoPrecioVenta").value = precioVenta;
    document.getElementById("productoExistencias").value = existencias;
    document.getElementById("productoCategoriaId").value = idCategoria;
    document.getElementById("productoProveedorId").value = idProveedor;
    document.getElementById("productoActivo").checked = activo;
}

// Función para cargar productos en los selects de venta
async function cargarProductosForVentas() {
    const productos = await apiCall(productosApiUrl, "GET"); // Se trae de nuevo, para asegurar la lista más reciente.
    allProductsData = productos; // Almacenar para cálculos de stock/precio
    document.querySelectorAll('.detalle-producto').forEach(select => {
        const currentIndex = select.dataset.index;
        select.innerHTML = '<option value="">Selecciona Producto</option>';
        productos.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id_producto;
            option.textContent = `${p.nombre_producto} (Exist: ${p.existencias}, P.Venta: $${p.precio_venta.toFixed(2)})`;
            option.dataset.precioVenta = p.precio_venta; // Almacenar precio de venta
            option.dataset.existencias = p.existencias; // Almacenar existencias
            select.appendChild(option);
        });
        // Si ya hay un producto seleccionado, intentar mantenerlo
        const currentProductId = select.dataset.selectedProductId;
        if (currentProductId) {
            select.value = currentProductId;
            // Disparar evento para actualizar precio unitario
            select.dispatchEvent(new Event('change'));
        }
    });
}


// ====================================================================================================
// --- VENTAS ---
// ====================================================================================================

const ventasApiUrl = `${API_BASE_URL}/ventas/`;
const ventaForm = document.getElementById("ventaForm");
const ventasContainer = document.getElementById("ventasContainer");
const ventaIdInput = document.getElementById("ventaId");
const submitVentaBtn = document.getElementById("submitVentaBtn");
const cancelVentaEditBtn = document.getElementById("cancelVentaEdit");
const addDetalleVentaBtn = document.getElementById("addDetalleVenta");
const ventaDetallesContainer = document.getElementById("ventaDetallesContainer");
const stockWarning = document.getElementById("stockWarning");

let detalleVentaCounter = 0; // Para dar IDs únicos a los detalles de venta

// Inicializar un detalle de venta al cargar
document.addEventListener("DOMContentLoaded", () => {
    addDetalleVentaRow();
    document.getElementById("ventaFecha").value = new Date().toISOString().slice(0,16); // Fecha actual por defecto
});

ventaForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = ventaIdInput.value;
    const detalles_ventas = [];
    let hasStockIssue = false;

    // Recolectar detalles de la venta
    document.querySelectorAll('.detalle-venta-item').forEach(item => {
        const productId = parseInt(item.querySelector('.detalle-producto').value);
        const cantidadVendida = parseInt(item.querySelector('.detalle-cantidad').value);
        const precioUnitario = parseFloat(item.querySelector('.detalle-precio-unitario').value);

        if (!productId || isNaN(cantidadVendida) || isNaN(precioUnitario) || cantidadVendida <= 0) {
            alert("Por favor, completa todos los campos de detalle de venta correctamente.");
            hasStockIssue = true; // Considerar esto como un error grave
            return;
        }

        // Validación de stock antes de enviar
        const productData = allProductsData.find(p => p.id_producto === productId);
        if (productData && productData.existencias < cantidadVendida) {
            stockWarning.textContent = `Advertencia: Stock insuficiente para el producto ${productData.nombre_producto}. Disponible: ${productData.existencias}, Solicitado: ${cantidadVendida}`;
            stockWarning.style.display = 'block';
            hasStockIssue = true;
            return;
        }

        detalles_ventas.push({
            id_producto: productId,
            cantidad_vendida: cantidadVendida,
            precio_unitario: precioUnitario
        });
    });

    if (hasStockIssue || detalles_ventas.length === 0) {
        if(detalles_ventas.length === 0) alert("La venta debe tener al menos un producto.");
        return; // Detener el envío si hay problemas
    }
    stockWarning.style.display = 'none'; // Ocultar advertencia si no hay problemas

    const data = {
        id_cliente: parseInt(document.getElementById("ventaClienteId").value),
        id_usuario: parseInt(document.getElementById("ventaUsuarioId").value),
        fecha_venta: document.getElementById("ventaFecha").value + ":00", // Asegurar formato ISO con segundos
        total: parseFloat(document.getElementById("ventaTotal").value), // El backend puede recalcular esto
        detalles_ventas: detalles_ventas,
    };

    if (id) { // Solo implementamos POST para ventas por su complejidad en PATCH/PUT
        alert("La edición de ventas con detalles no está implementada directamente. Por favor, crea una nueva venta.");
        return;
    } else { // Crear (POST)
        await apiCall(ventasApiUrl, "POST", data);
    }
    resetForm(ventaForm, 'ventaId', 'submitVentaBtn', 'cancelVentaEdit', 'Venta');
    cargarVentas();
    cargarProductosForVentas(); // Recargar productos para actualizar existencias visualmente
});


cancelVentaEditBtn.addEventListener("click", () => {
    resetForm(ventaForm, 'ventaId', 'submitVentaBtn', 'cancelVentaEdit', 'Venta');
});

addDetalleVentaBtn.addEventListener("click", addDetalleVentaRow);

// Event listener para el contenedor de detalles de venta (delegación de eventos)
ventaDetallesContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('detalle-producto') || e.target.classList.contains('detalle-cantidad')) {
        updateDetalleAndTotal(e.target.dataset.index);
    }
});
ventaDetallesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-detalle-btn')) {
        e.target.closest('.detalle-venta-item').remove();
        recalculateVentaTotal();
    }
});


function addDetalleVentaRow(productToPreselect = null, cantidadToPreselect = 1, precioToPreselect = 0) {
    const index = detalleVentaCounter++;
    const div = document.createElement("div");
    div.classList.add("detalle-venta-item");
    div.innerHTML = `
        <label for="detalleProducto${index}">Producto:</label>
        <select class="detalle-producto" id="detalleProducto${index}" data-index="${index}" required>
            <option value="">Selecciona Producto</option>
        </select>
        <label for="detalleCantidad${index}">Cantidad:</label>
        <input type="number" class="detalle-cantidad" id="detalleCantidad${index}" data-index="${index}" value="${cantidadToPreselect}" min="1" required>
        <label for="detallePrecioUnitario${index}">Precio Unitario:</label>
        <input type="number" class="detalle-precio-unitario" id="detallePrecioUnitario${index}" data-index="${index}" step="0.01" value="${precioToPreselect}" readonly>
        <button type="button" class="remove-detalle-btn" ${index === 0 ? 'style="display:none;"' : ''}>Remover</button>
    `;
    ventaDetallesContainer.appendChild(div);

    // Llenar el select del producto
    const productSelect = div.querySelector('.detalle-producto');
    allProductsData.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id_producto;
        option.textContent = `${p.nombre_producto} (Exist: ${p.existencias}, P.Venta: $${p.precio_venta.toFixed(2)})`;
        option.dataset.precioVenta = p.precio_venta;
        option.dataset.existencias = p.existencias;
        productSelect.appendChild(option);
    });

    if (productToPreselect) {
        productSelect.value = productToPreselect;
        // Si hay un producto preseleccionado, dispara el evento para actualizar el precio
        productSelect.dispatchEvent(new Event('change'));
    }
}

function updateDetalleAndTotal(index) {
    const productSelect = document.getElementById(`detalleProducto${index}`);
    const cantidadInput = document.getElementById(`detalleCantidad${index}`);
    const precioUnitarioInput = document.getElementById(`detallePrecioUnitario${index}`);

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const precioVenta = parseFloat(selectedOption.dataset.precioVenta || '0');
    const existencias = parseInt(selectedOption.dataset.existencias || '0');
    let cantidad = parseInt(cantidadInput.value);

    // Actualizar precio unitario
    precioUnitarioInput.value = precioVenta.toFixed(2);

    // Validar cantidad vs existencias
    if (cantidad > existencias) {
        stockWarning.textContent = `Advertencia: Solo hay ${existencias} unidades disponibles para este producto.`;
        stockWarning.style.display = 'block';
        cantidadInput.value = existencias; // Ajustar la cantidad al máximo disponible
        cantidad = existencias;
    } else {
        stockWarning.style.display = 'none';
    }

    recalculateVentaTotal();
}

function recalculateVentaTotal() {
    let total = 0;
    document.querySelectorAll('.detalle-venta-item').forEach(item => {
        const cantidad = parseInt(item.querySelector('.detalle-cantidad').value) || 0;
        const precio = parseFloat(item.querySelector('.detalle-precio-unitario').value) || 0;
        total += cantidad * precio;
    });
    document.getElementById("ventaTotal").value = total.toFixed(2);
}

async function cargarVentas() {
    const ventas = await apiCall(ventasApiUrl, "GET");
    ventasContainer.innerHTML = "";
    ventas.forEach(venta => {
        const div = document.createElement("div");
        div.classList.add("list-item");
        let detallesHtml = '<ul>';
        venta.detalles_ventas.forEach(detalle => {
            detallesHtml += `<li>${detalle.producto.nombre_producto} (x${detalle.cantidad_vendida}) - $${detalle.precio_unitario.toFixed(2)}</li>`;
        });
        detallesHtml += '</ul>';

        div.innerHTML = `
            <strong>ID Venta: ${venta.id_venta}</strong>
            <span>Cliente: ${venta.cliente ? venta.cliente.nombre : 'N/A'}</span>
            <span>Usuario: ${venta.usuario ? venta.usuario.nombre_usuario : 'N/A'}</span>
            <span>Fecha: ${new Date(venta.fecha_venta).toLocaleString()}</span>
            <span>Total: $${venta.total.toFixed(2)}</span>
            <p><strong>Productos:</strong></p>
            ${detallesHtml}
            <div class="acciones">
                <button class="delete" onclick="eliminarVenta(${venta.id_venta})">Eliminar</button>
            </div>
        `;
        ventasContainer.appendChild(div);
    });
}

async function eliminarVenta(id) {
    if (!confirm("¿Seguro que deseas eliminar esta venta?")) return;
    await apiCall(`${ventasApiUrl}${id}`, "DELETE");
    cargarVentas();
    cargarProductosForVentas(); // Recargar productos para restaurar existencias
}


// Función para cargar selects de Clientes y Usuarios para la Venta
async function cargarClientesAndUsuariosForVentas() {
    const clientes = await apiCall(clientesApiUrl, "GET");
    const usuarios = await apiCall(usuariosApiUrl, "GET");

    const clienteSelect = document.getElementById("ventaClienteId");
    clienteSelect.innerHTML = '<option value="">Selecciona Cliente</option>';
    clientes.forEach(cliente => {
        const option = document.createElement("option");
        option.value = cliente.id_cliente;
        option.textContent = cliente.nombre;
        clienteSelect.appendChild(option);
    });

    const usuarioSelect = document.getElementById("ventaUsuarioId");
    usuarioSelect.innerHTML = '<option value="">Selecciona Usuario</option>';
    usuarios.forEach(usuario => {
        const option = document.createElement("option");
        option.value = usuario.id_usuario;
        option.textContent = usuario.nombre_usuario;
        usuarioSelect.appendChild(option);
    });
}


// ====================================================================================================
// --- INICIALIZACIÓN ---
// ====================================================================================================

// Cargar datos iniciales al cargar la página.
// Primero se activa la pestaña de Clientes por defecto
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('.tab-button[data-tab="clientes"]').click();
    // Las demás cargas se harán cuando se cambie de pestaña,
    // o para las entidades con selects (productos, ventas), se cargarán sus dependencias.
});

// Precargar datos para los selects de Producto y Venta
document.addEventListener("DOMContentLoaded", () => {
    // Para Productos
    cargarCategorias(); // Carga categorías para el select de productos
    cargarProveedores(); // Carga proveedores para el select de productos

    // Para Ventas
    cargarClientesAndUsuariosForVentas(); // Carga clientes y usuarios para los selects de ventas
    cargarProductosForVentas(); // Carga productos para los selects de detalles de venta
});