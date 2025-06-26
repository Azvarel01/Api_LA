from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

class Cliente(SQLModel, table=True):
    id_cliente: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    correo: str = Field(unique=True, index=True)
    telefono: Optional[str]
    direccion: Optional[str]
    fecha_registro: datetime = Field(default_factory=datetime.now)
    activo: bool = Field(default=True)
    ventas: List["Venta"] = Relationship(back_populates="cliente")

    
class Proveedor(SQLModel, table=True):
    id_proveedor: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    correo: str = Field(unique=True, index=True)
    telefono: Optional[str]
    direccion: Optional[str]
    activo: bool = Field(default=True)
    productos: List["Producto"] = Relationship(back_populates="proveedor")

class Usuario(SQLModel, table=True):
    id_usuario: Optional[int] = Field(default=None, primary_key=True)
    nombre_usuario: str = Field(unique=True, index=True)
    nombre_completo: Optional[str]
    correo: str = Field(unique=True, index=True)
    contraseña_hash: str = Field()
    fecha_creacion: datetime = Field(default_factory=datetime.now)
    rol: str = Field(default="Vendedor")
    activo: bool = Field(default=True)
    ventas: List["Venta"] = Relationship(back_populates="usuario")

class Detalles_Venta(SQLModel, table=True):
    id_producto: Optional[int] = Field(default=None, primary_key=True)
    id_venta: Optional[int] = Field(default=None, primary_key=True)
    cantidad_vendida: int = Field()
    precio_unitario: float = Field()
    producto: Optional["Producto"] = Relationship(back_populates="detalles_ventas")
    venta:Optional["Venta"] = Relationship(back_populates="detalles_ventas")

class Producto(SQLModel, table=True):
    id_producto: Optional[int] = Field(default=None, primary_key=True)
    id_categoria: Optional[int] = Field(default=None, foreign_key="categoria.id_categoria")
    id_proveedor: Optional[int] = Field(default=None, foreign_key="proveedor.id_proveedor")
    nombre_producto: str = Field(index=True)
    existencias: int = Field(index=True)
    precio: float = Field()
    costo_adquisicion: Optional[float]
    categoria: Optional["Categoria"] = Relationship(back_populates="productos")
    proveedor: Optional["Proveedor"] = Relationship(back_populates="productos")
    ventas: List["Venta"] = Relationship(link_model=Detalles_Venta, back_populates="productos")
    detalles_ventas: List["Detalles_Venta"] = Relationship(back_populates="producto")

class Categoria(SQLModel, table=True):
    id_categoria: Optional[int] = Field(default=None, primary_key=True)
    nombre_categoria: str = Field(unique=True, index=True)
    descripcion: str = Field()
    productos: List["Producto"] = Relationship(back_populates="categoria")

class Venta(SQLModel, table=True):
    id_venta: Optional[int] = Field(default=None, primary_key=True)
    id_cliente: Optional[int] = Field(default=None, foreign_key="cliente.id_cliente")
    id_usuario: Optional[int] = Field(default=None, foreign_key="usuario.id_usuario")
    fecha_venta: datetime = Field(default_factory=datetime.now)
    estado: str = Field(default="Pendiente")
    metodo_pago: Optional[str]
    total: float =Field()
    cliente: Optional["Cliente"] = Relationship(back_populates="ventas")
    productos: List["Producto"] = Relationship(link_model=Detalles_Venta, back_populates="ventas")
    usuario: Optional["Usuario"] = Relationship(back_populates="ventas")
    detalles_ventas: List["Detalles_Venta"] = Relationship(back_populates="venta")