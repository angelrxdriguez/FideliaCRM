CREATE TABLE IF NOT EXISTS empresa (
  id INT PRIMARY KEY,
  nombre_comercial VARCHAR(150) NULL,
  razon_social VARCHAR(150) NULL,
  cif VARCHAR(20) NULL,
  telefono VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  direccion_fiscal VARCHAR(255) NULL,
  direccion_social VARCHAR(255) NULL,
  ciudad VARCHAR(100) NULL,
  provincia VARCHAR(100) NULL,
  codigo_postal VARCHAR(10) NULL,
);

INSERT IGNORE INTO empresa (id) VALUES (1);

ALTER TABLE clientes
  ADD INDEX idx_clientes_comercial (id_comercial),
  ADD CONSTRAINT fk_clientes_comercial
    FOREIGN KEY (id_comercial) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_comercial INT NOT NULL,
  id_tarifa INT NOT NULL,
  porcentaje_beneficio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  subtotal_base DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  observaciones VARCHAR(255) NULL,
  fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ventas_cliente (id_cliente),
  INDEX idx_ventas_comercial (id_comercial),
  INDEX idx_ventas_tarifa (id_tarifa),
  INDEX idx_ventas_fecha (fecha_venta),
  CONSTRAINT fk_ventas_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_comercial
    FOREIGN KEY (id_comercial) REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_tarifa
    FOREIGN KEY (id_tarifa) REFERENCES tarifas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS venta_detalles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_articulo INT NOT NULL,
  cantidad INT NOT NULL,
  precio_base_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  precio_venta_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal_base DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  subtotal_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  INDEX idx_venta_detalles_venta (id_venta),
  INDEX idx_venta_detalles_articulo (id_articulo),
  CONSTRAINT fk_venta_detalles_venta
    FOREIGN KEY (id_venta) REFERENCES ventas(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_venta_detalles_articulo
    FOREIGN KEY (id_articulo) REFERENCES articulos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);
