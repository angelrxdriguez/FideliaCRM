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
