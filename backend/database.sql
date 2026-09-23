CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    telefono VARCHAR(30) NOT NULL,

    tipo_entrega VARCHAR(30) NOT NULL,

    codigo_postal VARCHAR(20),

    calle VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    departamento VARCHAR(50),
    barrio VARCHAR(100),
    localidad VARCHAR(100) NOT NULL,

   medio_pago VARCHAR(50) NOT NULL DEFAULT 'transferencia',
total NUMERIC(12, 2) NOT NULL,
monto_transferencia NUMERIC(12, 2) NOT NULL DEFAULT 0,
saldo_efectivo NUMERIC(12, 2) NOT NULL DEFAULT 0,
estado VARCHAR(30) NOT NULL DEFAULT 'pendiente_transferencia',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE pedido_items (
    id SERIAL PRIMARY KEY,

    pedido_id INTEGER NOT NULL,

    producto VARCHAR(150) NOT NULL,
    talle VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,

    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,

    CONSTRAINT fk_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    colores TEXT[] NOT NULL,
    talles TEXT[] NOT NULL,
    precio NUMERIC(12, 2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO productos (
    nombre,
    categoria,
    colores,
    talles,
    precio
)
VALUES
(
    'Remera de algodón cardado',
    'Remeras',
    ARRAY[
        'Rojo', 'Azul Marino', 'Verde Militar', 'Negro',
        'Blanco', 'Amarillo', 'Naranja', 'Gris Topo',
        'Gris Melange', 'Celeste', 'Rosa', 'Violeta',
        'Lila', 'Bordo', 'Turquesa', 'Fucsia', 'Crudo',
        'Mostaza', 'Verde Manzana', 'Camel', 'Marrón',
        'Verde Brasil', 'Azul Francia', 'Verde Ingles'
    ],
    ARRAY['S', 'M', 'L', 'XL'],
    3900
),
(
    'Remera de algodón cardado',
    'Remeras',
    ARRAY[
        'Rojo', 'Azul Marino', 'Verde Militar', 'Negro',
        'Blanco', 'Amarillo', 'Naranja', 'Gris Topo',
        'Gris Melange', 'Celeste', 'Rosa', 'Violeta',
        'Lila', 'Bordo', 'Turquesa', 'Fucsia', 'Crudo',
        'Mostaza', 'Verde Manzana', 'Camel', 'Marrón',
        'Verde Brasil', 'Azul Francia', 'Verde Ingles'
    ],
    ARRAY['2XL'],
    4200
),
(
    'Remera de algodón cardado',
    'Remeras',
    ARRAY[
        'Rojo', 'Azul Marino', 'Verde Militar', 'Negro',
        'Blanco', 'Amarillo', 'Naranja', 'Gris Topo',
        'Gris Melange', 'Celeste', 'Rosa', 'Violeta',
        'Lila', 'Bordo', 'Turquesa', 'Fucsia', 'Crudo',
        'Mostaza', 'Verde Manzana', 'Camel', 'Marrón',
        'Verde Brasil', 'Azul Francia', 'Verde Ingles'
    ],
    ARRAY['3XL'],
    4400
),
(
    'Remera de algodón cardado',
    'Remeras',
    ARRAY[
        'Rojo', 'Azul Marino', 'Verde Militar', 'Negro',
        'Blanco', 'Amarillo', 'Naranja', 'Gris Topo',
        'Gris Melange', 'Celeste', 'Rosa', 'Violeta',
        'Lila', 'Bordo', 'Turquesa', 'Fucsia', 'Crudo',
        'Mostaza', 'Verde Manzana', 'Camel', 'Marrón',
        'Verde Brasil', 'Azul Francia', 'Verde Ingles'
    ],
    ARRAY['4XL'],
    4600
),
(
    'Remera de algodón cardado',
    'Remeras',
    ARRAY[
        'Rojo', 'Azul Marino', 'Verde Militar', 'Negro',
        'Blanco', 'Amarillo', 'Naranja', 'Gris Topo',
        'Gris Melange', 'Celeste', 'Rosa', 'Violeta',
        'Lila', 'Bordo', 'Turquesa', 'Fucsia', 'Crudo',
        'Mostaza', 'Verde Manzana', 'Camel', 'Marrón',
        'Verde Brasil', 'Azul Francia', 'Verde Ingles'
    ],
    ARRAY['5XL'],
    4800
),
(
    'Remera de algodón peinado',
    'Remeras',
    ARRAY[
        'Blanco', 'Negro', 'Rojo', 'Gris Melange',
        'Verde Militar', 'Violeta', 'Bordo'
    ],
    ARRAY['S', 'M', 'L', 'XL'],
    4900
),
(
    'Remera de algodón peinado',
    'Remeras',
    ARRAY[
        'Blanco', 'Negro', 'Rojo', 'Gris Melange',
        'Verde Militar', 'Violeta', 'Bordo'
    ],
    ARRAY['2XL'],
    5100
),
(
    'Remera de algodón peinado',
    'Remeras',
    ARRAY[
        'Blanco', 'Negro', 'Rojo', 'Gris Melange',
        'Verde Militar', 'Violeta', 'Bordo'
    ],
    ARRAY['3XL'],
    5300
),
(
    'Remera modal',
    'Remeras',
    ARRAY['Blanco', 'Negro', 'Gris'],
    ARRAY['S', 'M', 'L', 'XL'],
    4500
),
(
    'Remera modal',
    'Remeras',
    ARRAY['Blanco', 'Negro', 'Gris'],
    ARRAY['2XL'],
    4600
),
(
    'Remera modal',
    'Remeras',
    ARRAY['Blanco', 'Negro', 'Gris'],
    ARRAY['3XL'],
    4700
),
(
    'Remera deportiva',
    'Deportivo',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Verde',
        'Gris', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['S', 'M', 'L', 'XL'],
    4500
),
(
    'Remera deportiva',
    'Deportivo',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Verde',
        'Gris', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['2XL'],
    4600
),
(
    'Musculosa deportiva',
    'Musculosas',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Verde',
        'Gris', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['S', 'M', 'L', 'XL'],
    4350
),
(
    'Musculosa deportiva',
    'Musculosas',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Verde',
        'Gris', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['2XL'],
    4450
),
(
    'Musculosa deportiva',
    'Musculosas',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Verde',
        'Gris', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['3XL'],
    4550
),
(
    'Sudadera deportiva',
    'Deportivo',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Gris',
        'Verde', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['S', 'M', 'L', 'XL'],
    4350
),
(
    'Sudadera deportiva',
    'Deportivo',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Gris',
        'Verde', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['2XL'],
    4450
),
(
    'Sudadera deportiva',
    'Deportivo',
    ARRAY[
        'Blanco', 'Negro', 'Azul', 'Rojo', 'Gris',
        'Verde', 'Naranja', 'Amarillo', 'Celeste', 'Fucsia'
    ],
    ARRAY['3XL'],
    4550
),
(
    'Short liso deportivo sin bolsillo',
    'Shorts',
    ARRAY['Blanco', 'Negro', 'Azul', 'Rojo', 'Gris'],
    ARRAY['S', 'M', 'L', 'XL'],
    4350
),
(
    'Short liso deportivo sin bolsillo',
    'Shorts',
    ARRAY['Blanco', 'Negro', 'Azul', 'Rojo', 'Gris'],
    ARRAY['2XL'],
    4450
),
(
    'Short liso deportivo sin bolsillo',
    'Shorts',
    ARRAY['Blanco', 'Negro', 'Azul', 'Rojo', 'Gris'],
    ARRAY['3XL'],
    4550
),
(
    'Short liso deportivo con bolsillo',
    'Shorts',
    ARRAY['Blanco', 'Negro', 'Azul', 'Rojo', 'Gris'],
    ARRAY['S', 'M', 'L', 'XL'],
    4900
),
(
    'Short liso deportivo con bolsillo',
    'Shorts',
    ARRAY['Blanco', 'Negro', 'Azul', 'Rojo', 'Gris'],
    ARRAY['2XL'],
    5000
),
(
    'Short liso deportivo con bolsillo',
    'Shorts',
    ARRAY['Blanco', 'Negro', 'Azul', 'Rojo', 'Gris'],
    ARRAY['3XL'],
    5100
);