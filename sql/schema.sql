CREATE DATABASE IF NOT EXISTS kiddo_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kiddo_finance;

CREATE TABLE usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE perfiles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  nombre      VARCHAR(30) NOT NULL,
  edad        TINYINT NOT NULL CHECK (edad BETWEEN 1 AND 17),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE movimientos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  perfil_id   INT NOT NULL,
  tipo        ENUM('ingreso','gasto') NOT NULL,
  monto       DECIMAL(12,0) NOT NULL CHECK (monto > 0),
  descripcion VARCHAR(60) NOT NULL,
  categoria   VARCHAR(30) NOT NULL,
  fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE metas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  perfil_id     INT NOT NULL,
  nombre        VARCHAR(40) NOT NULL,
  monto_target  DECIMAL(12,0) NOT NULL CHECK (monto_target > 0),
  ahorrado      DECIMAL(12,0) NOT NULL DEFAULT 0 CHECK (ahorrado >= 0),
  fecha_limite  DATE NOT NULL,
  categoria     VARCHAR(30) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
