CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS equipo (
    equipo_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    logo_url TEXT,
    target_index_e INT UNIQUE, 
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash TEXT NOT NULL,
    foto_perfil_url TEXT,
    equipo_favorito_id INT REFERENCES equipo(equipo_id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
    CREATE TYPE tipo_recurso_enum AS ENUM ('imagen_marcador', 'modelo_3d', 'video', 'audio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS recurso_multimedia (
    multimedia_id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo_recurso tipo_recurso_enum NOT NULL,
    archivo_url TEXT NOT NULL,
    marcador_url TEXT,
    equipo_id INT REFERENCES equipo(equipo_id) ON DELETE CASCADE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carta (
    carta_id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    jugador_nombre VARCHAR(100),
    imagen_url TEXT NOT NULL,
    equipo_id INT REFERENCES equipo(equipo_id) ON DELETE CASCADE,
    multimedia_ar_id INT REFERENCES recurso_multimedia(multimedia_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS estadistica_deportiva (
    estadistica_id SERIAL PRIMARY KEY,
    equipo_id INT REFERENCES equipo(equipo_id) ON DELETE CASCADE,
    jugador_nombre VARCHAR(100),
    partidos_jugados INT DEFAULT 0,
    carreras_anotadas INT DEFAULT 0,
    home_runs INT DEFAULT 0,
    promedio_bateo DECIMAL(4,3),
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trivia (
    trivia_id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    equipo_id INT REFERENCES equipo(equipo_id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pregunta_trivia (
    pregunta_id SERIAL PRIMARY KEY,
    trivia_id INT NOT NULL REFERENCES trivia(trivia_id) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    puntos_otorgados INT DEFAULT 10
);

CREATE TABLE IF NOT EXISTS opcion_respuesta (
    opcion_id SERIAL PRIMARY KEY,
    pregunta_id INT NOT NULL REFERENCES pregunta_trivia(pregunta_id) ON DELETE CASCADE,
    texto_opcion TEXT NOT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS intento_trivia (
    intento_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
    trivia_id INT NOT NULL REFERENCES trivia(trivia_id) ON DELETE CASCADE,
    puntaje_obtenido INT NOT NULL DEFAULT 0,
    completado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);