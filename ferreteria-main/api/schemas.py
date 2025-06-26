from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel # Necesaria si usas BaseModel directamente (aunque SQLModel ya lo incluye)

# --- Esquemas API ---

# Esquemas para Cliente
class ClienteBase(SQLModel):
    nombre: str
    correo: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = True

class ClienteCreate(ClienteBase):
    pass

class ClienteRead(ClienteBase):
    id_cliente: int
    fecha_registro: datetime

# Esquema para leer con ventas (versión simple para evitar recursión)
class VentaReadSimple(SQLModel):
    id_venta: int
    fecha_venta: datetime
    estado: str
    metodo_pago: Optional[str] = None
    total: float
    id_cliente: Optional[int] = None
    id_usuario: Optional[int] = None


class ClienteReadWithVentas(ClienteRead):
    ventas: List[VentaReadSimple] = [] # Usamos VentaReadSimple para evitar anidamiento profundo

class ClienteUpdate(SQLModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None


# Esquemas para Proveedor
class ProveedorBase(SQLModel):
    nombre: str
    correo: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = True

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorRead(ProveedorBase):
    id_proveedor: int

class ProveedorUpdate(SQLModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None

# Esquemas para Usuario
class UsuarioBase(SQLModel):
    nombre_usuario: str
    nombre_completo: Optional[str] = None
    correo: str
    rol: str = "Vendedor"
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    contraseña: str # Contraseña en texto plano para la solicitud de creación

class UsuarioRead(UsuarioBase):
    id_usuario: int
    fecha_creacion: datetime

class UsuarioUpdate(SQLModel):
    nombre_usuario: Optional[str] = None
    nombre_completo: Optional[str] = None
    correo: Optional[str] = None
    contraseña: Optional[str] = None # Para cambiar la contraseña
    rol: Optional[str] = None
    activo: Optional[bool] = None


# Esquemas para Categoria
class CategoriaBase(SQLModel):
    nombre_categoria: str
    # CAMBIO AQUÍ: Ahora es opcional y con valor por defecto None
    descripcion: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaRead(CategoriaBase):
    id_categoria: int

class CategoriaUpdate(SQLModel):
    nombre_categoria: Optional[str] = None
    descripcion: Optional[str] = None


# Esquemas para Producto
class ProductoBase(SQLModel):
    id_categoria: Optional[int] = None
    id_proveedor: Optional[int] = None
    nombre_producto: str
    existencias: int
    # CAMBIO AQUÍ: `precio` ahora es `precio_venta`
    precio_venta: float
    # CAMBIO AQUÍ: `costo_adquisicion` ahora es `precio_compra`
    precio_compra: Optional[float] = None
    activo: bool = True # Asegúrate de que este campo también esté presente si lo usas en el modelo


class ProductoCreate(ProductoBase):
    pass

class ProductoRead(ProductoBase):
    id_producto: int

class ProductoReadWithRelations(ProductoRead):
    categoria: Optional["CategoriaRead"] = None
    proveedor: Optional["ProveedorRead"] = None

class ProductoUpdate(SQLModel):
    id_categoria: Optional[int] = None
    id_proveedor: Optional[int] = None
    nombre_producto: Optional[str] = None
    existencias: Optional[int] = None
    # CAMBIO AQUÍ: `precio` ahora es `precio_venta`
    precio_venta: Optional[float] = None
    # CAMBIO AQUÍ: `costo_adquisicion` ahora es `precio_compra`
    precio_compra: Optional[float] = None
    activo: Optional[bool] = None # Asegúrate de que este campo también esté presente si lo usas en el modelo


# Esquemas para Detalles_Venta (usados como parte de Venta)
class DetallesVentaBase(SQLModel):
    id_producto: int
    cantidad_vendida: int
    precio_unitario: float

class DetallesVentaCreate(DetallesVentaBase):
    pass

class DetallesVentaRead(DetallesVentaBase):
    id_producto: int
    id_venta: int # Incluido para referencia en el esquema de lectura

# Esquema para DetallesVenta con información de Producto (para VentaReadWithRelations)
# Aquí también debemos asegurar que ProductoReadSimple use los nuevos nombres de precio
class ProductoReadSimple(SQLModel): # Hereda de SQLModel para tener los campos
    id_producto: int
    nombre_producto: str
    existencias: int
    precio_venta: float # Usar el nombre de campo correcto
    precio_compra: Optional[float] = None # Usar el nombre de campo correcto
    activo: bool # Asegúrate de que este campo también esté presente si lo usas en el modelo


class DetallesVentaReadWithProduct(DetallesVentaRead):
    producto: Optional[ProductoReadSimple] = None


# Esquemas para Venta
class VentaBase(SQLModel):
    id_cliente: Optional[int] = None
    id_usuario: Optional[int] = None
    estado: str = "Pendiente"
    metodo_pago: Optional[str] = None
    total: float

class VentaCreate(VentaBase):
    detalles_ventas: List[DetallesVentaCreate]

class VentaRead(VentaBase):
    id_venta: int
    fecha_venta: datetime

# VentaReadSimple ya definida para uso en ClienteReadWithVentas

class VentaReadWithRelations(VentaRead):
    cliente: Optional[ClienteRead] = None # Usa ClienteRead, no ClienteReadWithVentas
    usuario: Optional[UsuarioRead] = None
    detalles_ventas: List[DetallesVentaReadWithProduct] = []

class VentaUpdate(SQLModel):
    id_cliente: Optional[int] = None
    id_usuario: Optional[int] = None
    estado: Optional[str] = None
    metodo_pago: Optional[str] = None
    total: Optional[float] = None