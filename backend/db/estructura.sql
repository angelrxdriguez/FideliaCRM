CREATE DATABASE IF NOT EXISTS fidelia;
USE fidelia;

CREATE TABLE tipo_familia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    activo TINYINT(1) DEFAULT 1
);

CREATE TABLE familias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activa TINYINT(1) DEFAULT 1,
    INDEX idx_familias_tipo (id_tipo),
    CONSTRAINT fk_familias_tipo
        FOREIGN KEY (id_tipo) REFERENCES tipo_familia(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


CREATE TABLE articulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    familia_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    sku VARCHAR(50) NULL UNIQUE,
    formato VARCHAR(100) NULL,
    unidad_medida VARCHAR(30) NULL,
    precio_base DECIMAL(10,2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    INDEX idx_articulos_familia (familia_id),
    CONSTRAINT fk_articulos_familias
        FOREIGN KEY (familia_id) REFERENCES familias(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE roles_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    activo TINYINT(1) DEFAULT 1
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    INDEX idx_usuarios_rol (rol_id),
    CONSTRAINT fk_usuarios_roles
        FOREIGN KEY (rol_id) REFERENCES roles_usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);
