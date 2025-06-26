from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload # <-- ¡NUEVA IMPORTACIÓN!
from passlib.context import CryptContext

from api.schemas import (
    ClienteCreate, ProveedorCreate, ClienteRead, ClienteUpdate,
    ProveedorRead, ProveedorUpdate,
    UsuarioCreate, UsuarioRead, UsuarioUpdate,
    CategoriaCreate, CategoriaRead, CategoriaUpdate,
    ProductoCreate, ProductoRead, ProductoReadWithRelations, ProductoUpdate,
    VentaCreate, VentaRead, VentaReadWithRelations, VentaUpdate,
    DetallesVentaCreate # Necesario para VentaCreate
)
from api.database import get_session

# --- Importa el módulo de modelos completo ---
from . import models

# --- Configuración para Hash de Contraseñas ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

router = APIRouter()

# --- ENDPOINTS PARA CLIENTES ---

@router.post("/clientes/", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
def create_cliente(cliente_in: ClienteCreate, session: Session = Depends(get_session)):
    """Crea un nuevo cliente en la base de datos."""
    db_cliente = models.Cliente.model_validate(cliente_in)
    session.add(db_cliente)
    session.commit()
    session.refresh(db_cliente)
    return db_cliente

@router.get("/clientes/", response_model=list[ClienteRead])
def obtener_clientes(session: Session = Depends(get_session)):
    """Obtiene una lista de todos los clientes."""
    statement = select(models.Cliente)
    clientes = session.exec(statement).all()
    return clientes

@router.get("/clientes/{id_cliente}", response_model=ClienteRead)
def obtener_cliente_por_id(id_cliente: int, session: Session = Depends(get_session)):
    """Obtiene un cliente específico por su ID."""
    cliente = session.get(models.Cliente, id_cliente)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.put("/clientes/{id_cliente}", response_model=ClienteRead)
def actualizar_cliente(
    id_cliente: int,
    cliente_in: ClienteCreate,
    session: Session = Depends(get_session)
):
    """Actualiza completamente un cliente existente."""
    cliente_db = session.get(models.Cliente, id_cliente)
    if not cliente_db:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente_db.model_validate(cliente_in, update=True)

    session.add(cliente_db)
    session.commit()
    session.refresh(cliente_db)
    return cliente_db

@router.patch("/clientes/{id_cliente}", response_model=ClienteRead)
def actualizar_cliente_parcial(
    id_cliente: int,
    cliente_in: ClienteUpdate,
    session: Session = Depends(get_session)
):
    """Actualiza parcialmente un cliente existente."""
    cliente_db = session.get(models.Cliente, id_cliente)
    if not cliente_db:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    update_data = cliente_in.model_dump(exclude_unset=True)
    cliente_db.model_validate(update_data, update=True)

    session.add(cliente_db)
    session.commit()
    session.refresh(cliente_db)
    return cliente_db

@router.delete("/clientes/{id_cliente}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cliente(id_cliente: int, session: Session = Depends(get_session)):
    """Elimina un cliente por su ID."""
    cliente = session.get(models.Cliente, id_cliente)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    session.delete(cliente)
    session.commit()
    return

# --- ENDPOINTS PARA PROVEEDORES ---

@router.post("/proveedores/", response_model=ProveedorRead, status_code=status.HTTP_201_CREATED)
def crear_proveedor(proveedor_in: ProveedorCreate, session: Session = Depends(get_session)):
    """Crea un nuevo proveedor en la base de datos."""
    db_proveedor = models.Proveedor.model_validate(proveedor_in)
    session.add(db_proveedor)
    session.commit()
    session.refresh(db_proveedor)
    return db_proveedor

@router.get("/proveedores/", response_model=list[ProveedorRead])
def obtener_proveedores(session: Session = Depends(get_session)):
    """Obtiene una lista de todos los proveedores."""
    statement = select(models.Proveedor)
    proveedores = session.exec(statement).all()
    return proveedores

@router.get("/proveedores/{id_proveedor}", response_model=ProveedorRead)
def obtener_proveedor_por_id(id_proveedor: int, session: Session = Depends(get_session)):
    """Obtiene un proveedor específico por su ID."""
    proveedor = session.get(models.Proveedor, id_proveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor

@router.put("/proveedores/{id_proveedor}", response_model=ProveedorRead)
def actualizar_proveedor(
    id_proveedor: int,
    proveedor_in: ProveedorCreate,
    session: Session = Depends(get_session)
):
    """Actualiza completamente un proveedor existente."""
    db_proveedor = session.get(models.Proveedor, id_proveedor)
    if not db_proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    db_proveedor.model_validate(proveedor_in, update=True)

    session.add(db_proveedor)
    session.commit()
    session.refresh(db_proveedor)
    return db_proveedor

@router.patch("/proveedores/{id_proveedor}", response_model=ProveedorRead)
def actualizar_proveedor_parcial(
    id_proveedor: int,
    proveedor_in: ProveedorUpdate,
    session: Session = Depends(get_session)
):
    """Actualiza parcialmente un proveedor existente."""
    db_proveedor = session.get(models.Proveedor, id_proveedor)
    if not db_proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    update_data = proveedor_in.model_dump(exclude_unset=True)
    db_proveedor.model_validate(update_data, update=True)

    session.add(db_proveedor)
    session.commit()
    session.refresh(db_proveedor)
    return db_proveedor

@router.delete("/proveedores/{id_proveedor}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_proveedor(id_proveedor: int, session: Session = Depends(get_session)):
    """Elimina un proveedor por su ID."""
    proveedor = session.get(models.Proveedor, id_proveedor)
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    session.delete(proveedor)
    session.commit()
    return

# --- ENDPOINTS PARA USUARIOS ---

@router.post("/usuarios/", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def create_usuario(usuario_in: UsuarioCreate, session: Session = Depends(get_session)):
    """Crea un nuevo usuario en la base de datos."""
    hashed_password = get_password_hash(usuario_in.contraseña)
    db_usuario = models.Usuario(
        nombre_usuario=usuario_in.nombre_usuario,
        nombre_completo=usuario_in.nombre_completo,
        correo=usuario_in.correo,
        contraseña_hash=hashed_password,
        rol=usuario_in.rol,
        activo=usuario_in.activo
    )
    
    session.add(db_usuario)
    session.commit()
    session.refresh(db_usuario)
    return db_usuario

@router.get("/usuarios/", response_model=list[UsuarioRead])
def read_usuarios(session: Session = Depends(get_session)):
    """Obtiene una lista de todos los usuarios."""
    statement = select(models.Usuario)
    usuarios = session.exec(statement).all()
    return usuarios

@router.get("/usuarios/{id_usuario}", response_model=UsuarioRead)
def read_usuario_by_id(id_usuario: int, session: Session = Depends(get_session)):
    """Obtiene un usuario específico por su ID."""
    usuario = session.get(models.Usuario, id_usuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

@router.put("/usuarios/{id_usuario}", response_model=UsuarioRead)
def update_usuario(
    id_usuario: int,
    usuario_in: UsuarioCreate,
    session: Session = Depends(get_session)
):
    """Actualiza completamente un usuario existente."""
    db_usuario = session.get(models.Usuario, id_usuario)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario_in.contraseña:
        # Crea una copia mutable de usuario_in.model_dump()
        update_data = usuario_in.model_dump()
        update_data["contraseña_hash"] = get_password_hash(update_data.pop("contraseña"))
    else:
        # Si no se proporciona contraseña, simplemente toma los otros campos
        update_data = usuario_in.model_dump(exclude={"contraseña"})

    db_usuario.model_validate(update_data, update=True)

    session.add(db_usuario)
    session.commit()
    session.refresh(db_usuario)
    return db_usuario

@router.patch("/usuarios/{id_usuario}", response_model=UsuarioRead)
def update_usuario_partial(
    id_usuario: int,
    usuario_in: UsuarioUpdate,
    session: Session = Depends(get_session)
):
    """Actualiza parcialmente un usuario existente."""
    db_usuario = session.get(models.Usuario, id_usuario)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = usuario_in.model_dump(exclude_unset=True)

    if "contraseña" in update_data:
        update_data["contraseña_hash"] = get_password_hash(update_data.pop("contraseña"))

    db_usuario.model_validate(update_data, update=True)

    session.add(db_usuario)
    session.commit()
    session.refresh(db_usuario)
    return db_usuario

@router.delete("/usuarios/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def delete_usuario(id_usuario: int, session: Session = Depends(get_session)):
    """Elimina un usuario por su ID."""
    usuario = session.get(models.Usuario, id_usuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    session.delete(usuario)
    session.commit()
    return

# --- ENDPOINTS PARA CATEGORIAS ---

@router.post("/categorias/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def create_categoria(categoria_in: CategoriaCreate, session: Session = Depends(get_session)):
    """Crea una nueva categoría en la base de datos."""
    db_categoria = models.Categoria.model_validate(categoria_in)
    session.add(db_categoria)
    session.commit()
    session.refresh(db_categoria)
    return db_categoria

@router.get("/categorias/", response_model=list[CategoriaRead])
def read_categorias(session: Session = Depends(get_session)):
    """Obtiene una lista de todas las categorías."""
    statement = select(models.Categoria)
    categorias = session.exec(statement).all()
    return categorias

@router.get("/categorias/{id_categoria}", response_model=CategoriaRead)
def read_categoria_by_id(id_categoria: int, session: Session = Depends(get_session)):
    """Obtiene una categoría específica por su ID."""
    categoria = session.get(models.Categoria, id_categoria)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria

@router.put("/categorias/{id_categoria}", response_model=CategoriaRead)
def update_categoria(
    id_categoria: int,
    categoria_in: CategoriaCreate,
    session: Session = Depends(get_session)
):
    """Actualiza completamente una categoría existente."""
    db_categoria = session.get(models.Categoria, id_categoria)
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    db_categoria.model_validate(categoria_in, update=True)

    session.add(db_categoria)
    session.commit()
    session.refresh(db_categoria)
    return db_categoria

@router.patch("/categorias/{id_categoria}", response_model=CategoriaRead)
def update_categoria_partial(
    id_categoria: int,
    categoria_in: CategoriaUpdate,
    session: Session = Depends(get_session)
):
    """Actualiza parcialmente una categoría existente."""
    db_categoria = session.get(models.Categoria, id_categoria)
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    update_data = categoria_in.model_dump(exclude_unset=True)
    db_categoria.model_validate(update_data, update=True)

    session.add(db_categoria)
    session.commit()
    session.refresh(db_categoria)
    return db_categoria

@router.delete("/categorias/{id_categoria}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(id_categoria: int, session: Session = Depends(get_session)):
    """Elimina una categoría por su ID."""
    categoria = session.get(models.Categoria, id_categoria)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    session.delete(categoria)
    session.commit()
    return

# --- ENDPOINTS PARA PRODUCTOS ---

@router.post("/productos/", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
def create_producto(producto_in: ProductoCreate, session: Session = Depends(get_session)):
    """Crea un nuevo producto en la base de datos."""
    db_producto = models.Producto.model_validate(producto_in)
    session.add(db_producto)
    session.commit()
    session.refresh(db_producto)
    return db_producto

@router.get("/productos/", response_model=list[ProductoReadWithRelations])
def read_productos(session: Session = Depends(get_session)):
    """Obtiene una lista de todos los productos."""
    # Cargando las relaciones para que se incluyan en la respuesta
    statement = select(models.Producto).options(
        selectinload(models.Producto.categoria),
        selectinload(models.Producto.proveedor)
    )
    productos = session.exec(statement).all()
    return productos

@router.get("/productos/{id_producto}", response_model=ProductoReadWithRelations)
def read_producto_by_id(id_producto: int, session: Session = Depends(get_session)):
    """Obtiene un producto específico por su ID."""
    # Cargando las relaciones para que se incluyan en la respuesta
    statement = select(models.Producto).where(models.Producto.id_producto == id_producto).options(
        selectinload(models.Producto.categoria),
        selectinload(models.Producto.proveedor)
    )
    producto = session.exec(statement).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

@router.put("/productos/{id_producto}", response_model=ProductoRead)
def update_producto(
    id_producto: int,
    producto_in: ProductoCreate,
    session: Session = Depends(get_session)
):
    """Actualiza completamente un producto existente."""
    db_producto = session.get(models.Producto, id_producto)
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db_producto.model_validate(producto_in, update=True)

    session.add(db_producto)
    session.commit()
    session.refresh(db_producto)
    return db_producto

@router.patch("/productos/{id_producto}", response_model=ProductoRead)
def update_producto_partial(
    id_producto: int,
    producto_in: ProductoUpdate,
    session: Session = Depends(get_session)
):
    """Actualiza parcialmente un producto existente."""
    db_producto = session.get(models.Producto, id_producto)
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    update_data = producto_in.model_dump(exclude_unset=True)
    db_producto.model_validate(update_data, update=True)

    session.add(db_producto)
    session.commit()
    session.refresh(db_producto)
    return db_producto

@router.delete("/productos/{id_producto}", status_code=status.HTTP_204_NO_CONTENT)
def delete_producto(id_producto: int, session: Session = Depends(get_session)):
    """Elimina un producto por su ID."""
    producto = session.get(models.Producto, id_producto)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    session.delete(producto)
    session.commit()
    return

# --- ENDPOINTS PARA VENTAS ---

@router.post("/ventas/", response_model=VentaReadWithRelations, status_code=status.HTTP_201_CREATED)
def create_venta(venta_in: VentaCreate, session: Session = Depends(get_session)):
    """Crea una nueva venta con sus detalles (productos vendidos)."""
    # 1. Crear la Venta principal
    db_venta = models.Venta.model_validate(venta_in.model_dump(exclude={"detalles_ventas"}))

    session.add(db_venta)
    session.flush() # Para obtener el id_venta antes de añadir los detalles

    # 2. Crear los Detalles_Venta asociados
    total_calculado = 0.0
    for detalle_in in venta_in.detalles_ventas:
        producto = session.get(models.Producto, detalle_in.id_producto)
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto con ID {detalle_in.id_producto} no encontrado para la venta.")
        if producto.existencias < detalle_in.cantidad_vendida:
            raise HTTPException(status_code=400, detail=f"No hay suficientes existencias del producto '{producto.nombre_producto}'. Disponible: {producto.existencias}, Solicitado: {detalle_in.cantidad_vendida}")

        db_detalle = models.Detalles_Venta(
            id_venta=db_venta.id_venta,
            id_producto=detalle_in.id_producto,
            cantidad_vendida=detalle_in.cantidad_vendida,
            precio_unitario=detalle_in.precio_unitario
        )
        session.add(db_detalle)
        total_calculado += detalle_in.cantidad_vendida * detalle_in.precio_unitario
        
        # Actualizar existencias del producto
        producto.existencias -= detalle_in.cantidad_vendida
        session.add(producto)

    # 3. Actualizar el total de la venta (si no se proporciona o si se recalcula)
    if venta_in.total is None or venta_in.total != total_calculado:
        # En lugar de solo print, podrías elevar una HTTPException si el total enviado no coincide.
        # Por ahora, simplemente lo ajustamos al calculado.
        if venta_in.total is not None and venta_in.total != total_calculado:
            print(f"Advertencia: Total enviado ({venta_in.total}) difiere del calculado ({total_calculado}) para Venta {db_venta.id_venta}. Usando el calculado.")
        db_venta.total = total_calculado
    
    session.add(db_venta)
    session.commit()
    session.refresh(db_venta)

    # Cargar la venta de nuevo con las relaciones para la respuesta correcta
    db_venta_with_relations = session.exec(
        select(models.Venta)
        .where(models.Venta.id_venta == db_venta.id_venta)
        .options(
            selectinload(models.Venta.cliente),
            selectinload(models.Venta.usuario),
            selectinload(models.Venta.detalles_ventas).selectinload(models.Detalles_Venta.producto)
        )
    ).first()
    
    if not db_venta_with_relations: # Esto no debería ocurrir después de un commit/refresh exitoso
        raise HTTPException(status_code=500, detail="Error al recuperar la venta recién creada con relaciones.")

    return db_venta_with_relations

@router.get("/ventas/", response_model=list[VentaReadWithRelations])
def read_ventas(session: Session = Depends(get_session)):
    """Obtiene una lista de todas las ventas."""
    # Cargando las relaciones para que se incluyan en la respuesta
    statement = select(models.Venta).options(
        selectinload(models.Venta.cliente),
        selectinload(models.Venta.usuario),
        selectinload(models.Venta.detalles_ventas).selectinload(models.Detalles_Venta.producto)
    )
    ventas = session.exec(statement).all()
    return ventas

@router.get("/ventas/{id_venta}", response_model=VentaReadWithRelations)
def read_venta_by_id(id_venta: int, session: Session = Depends(get_session)):
    """Obtiene una venta específica por su ID."""
    # Cargando las relaciones para que se incluyan en la respuesta
    statement = select(models.Venta).where(models.Venta.id_venta == id_venta).options(
        selectinload(models.Venta.cliente),
        selectinload(models.Venta.usuario),
        selectinload(models.Venta.detalles_ventas).selectinload(models.Detalles_Venta.producto)
    )
    venta = session.exec(statement).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta

# NOTA: Las operaciones PUT y PATCH para Ventas pueden ser complejas
# si implican la modificación de los Detalles_Venta. A menudo, se manejan
# como operaciones separadas (ej. un PATCH para /ventas/{id}/detalles) o
# con lógica más compleja para añadir/eliminar/modificar detalles existentes.
# Aquí un ejemplo básico de PATCH que no modifica los detalles.

@router.patch("/ventas/{id_venta}", response_model=VentaRead)
def update_venta_partial(
    id_venta: int,
    venta_in: VentaUpdate,
    session: Session = Depends(get_session)
):
    """Actualiza parcialmente una venta existente (sin modificar detalles de productos)."""
    db_venta = session.get(models.Venta, id_venta)
    if not db_venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    update_data = venta_in.model_dump(exclude_unset=True)
    db_venta.model_validate(update_data, update=True)

    session.add(db_venta)
    session.commit()
    session.refresh(db_venta)
    return db_venta

@router.delete("/ventas/{id_venta}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venta(id_venta: int, session: Session = Depends(get_session)):
    """Elimina una venta por su ID."""
    venta = session.get(models.Venta, id_venta)
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    # Eliminar los detalles de venta asociados (opcional, pero buena práctica para integridad)
    statement_detalles = select(models.Detalles_Venta).where(models.Detalles_Venta.id_venta == id_venta)
    detalles = session.exec(statement_detalles).all()
    for detalle in detalles:
        session.delete(detalle)

    session.delete(venta)
    session.commit()
    return