BEGIN;

CREATE TABLE equipo (
    equipo_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    ciudad VARCHAR(100),
    descripcion TEXT,
    historia TEXT,
    logo_url TEXT,
    target_index_e INT UNIQUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_target CHECK (target_index_e BETWEEN 0 AND 14)
);

CREATE TABLE usuario (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    foto_perfil_url TEXT,
    equipo_favorito_id INT REFERENCES equipo(equipo_id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    carta_favorita_id INT REFERENCES carta(carta_id) ON DELETE SET NULL
);

CREATE TYPE tipo_recurso_enum AS ENUM (
    'imagen',
    'imagen_marcador',
    'modelo_3d',
    'video',
    'audio'
);

CREATE TABLE recurso_multimedia (
    multimedia_id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo_recurso tipo_recurso_enum NOT NULL,
    archivo_url TEXT NOT NULL,
    marcador_url TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recurso_equipo (
    multimedia_id INT NOT NULL REFERENCES recurso_multimedia(multimedia_id) ON DELETE CASCADE,
    equipo_id INT NOT NULL REFERENCES equipo(equipo_id) ON DELETE CASCADE,
    PRIMARY KEY (multimedia_id, equipo_id)
);

ALTER TABLE equipo ADD COLUMN modelo_ar_id INT
    REFERENCES recurso_multimedia(multimedia_id)
ON DELETE SET NULL;

CREATE TABLE carta (
    carta_id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    jugador_nombre VARCHAR(100),
    imagen_url TEXT NOT NULL,
    equipo_id INT NOT NULL UNIQUE REFERENCES equipo(equipo_id) ON DELETE CASCADE,
    multimedia_ar_id INT REFERENCES recurso_multimedia(multimedia_id) ON DELETE SET NULL,
    rareza SMALLINT NOT NULL DEFAULT 1 CHECK (rareza BETWEEN 1 AND 5)
);

CREATE TABLE estadistica_deportiva (
    estadistica_id SERIAL PRIMARY KEY,
    equipo_id INT NOT NULL REFERENCES equipo(equipo_id) ON DELETE CASCADE,
    jugador_nombre VARCHAR(100),
    partidos_jugados INT NOT NULL DEFAULT 0,
    carreras_anotadas INT NOT NULL DEFAULT 0,
    home_runs INT NOT NULL DEFAULT 0,
    promedio_bateo NUMERIC(4,3),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (partidos_jugados >= 0),
    CHECK (carreras_anotadas >= 0),
    CHECK (home_runs >= 0),
    CHECK (promedio_bateo IS NULLOR promedio_bateo BETWEEN 0 AND 1 )
);

CREATE TABLE trivia (
    trivia_id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pregunta_trivia (
    pregunta_id SERIAL PRIMARY KEY,
    trivia_id INT NOT NULL REFERENCES trivia(trivia_id) ON DELETE CASCADE,
    equipo_id INT NOT NULL REFERENCES equipo(equipo_id) ON DELETE RESTRICT,
    enunciado TEXT NOT NULL,
    puntos_otorgados INT NOT NULL DEFAULT 10,
    imagen_url TEXT;
    CHECK (puntos_otorgados > 0),
    UNIQUE (pregunta_id, trivia_id)
);

CREATE TABLE opcion_respuesta (
    opcion_id SERIAL PRIMARY KEY,
    pregunta_id INT NOT NULL REFERENCES pregunta_trivia(pregunta_id) ON DELETE CASCADE,
    texto_opcion TEXT NOT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (pregunta_id, opcion_id)
);

CREATE UNIQUE INDEX uq_respuesta_correcta
ON opcion_respuesta(pregunta_id)
WHERE es_correcta = TRUE;

CREATE TABLE intento_trivia (
    intento_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
    trivia_id INT NOT NULL REFERENCES trivia(trivia_id) ON DELETE CASCADE,
    puntaje_obtenido INT NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'completado') ),
    iniciado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completado_en TIMESTAMPTZ,
    CHECK (puntaje_obtenido >= 0),
    UNIQUE (intento_id, trivia_id)
);

CREATE TABLE respuesta_usuario (
    respuesta_id SERIAL PRIMARY KEY,
    intento_id INT NOT NULL,
    trivia_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    opcion_id INT NOT NULL,
    respondida_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (intento_id, trivia_id) REFERENCES intento_trivia(intento_id, trivia_id) ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id, trivia_id) REFERENCES pregunta_trivia(pregunta_id, trivia_id) ON DELETE RESTRICT,
    FOREIGN KEY (pregunta_id, opcion_id) REFERENCES opcion_respuesta(pregunta_id, opcion_id) ON DELETE RESTRICT,
    UNIQUE (intento_id, pregunta_id)
);

CREATE TABLE intento_pregunta (
    intento_id INT NOT NULL REFERENCES intento_trivia(intento_id) ON DELETE CASCADE
    pregunta_id INT NOT NULL REFERENCES pregunta_trivia(pregunta_id) ON DELETE RESTRICT,
    posicion SMALLINT NOT NULL CHECK (posicion BETWEEN 1 AND 5),
    PRIMARY KEY (intento_id, pregunta_id),
    UNIQUE (intento_id, posicion)
);

CREATE TABLE partida_juego (
    partida_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
    equipo_id INT REFERENCES equipo(equipo_id) ON DELETE SET NULL,
    puntuacion INT NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'completada')),
    iniciada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalizada_en TIMESTAMPTZ,
    CHECK (puntuacion >= 0)
);

CREATE TABLE foto_usuario (
    foto_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
    equipo_id INT REFERENCES equipo(equipo_id) ON DELETE SET NULL,
    imagen_url TEXT NOT NULL,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario_carta (
    usuario_carta_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
    carta_id INT NOT NULL REFERENCES carta(carta_id) ON DELETE CASCADE,
    obtenida_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, carta_id)
);

CREATE TABLE movimiento_puntos (
    movimiento_id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuario(usuario_id) ON DELETE CASCADE,
    cantidad INT NOT NULL,
    origen VARCHAR(20) NOT NULLCHECK (origen IN ('trivia', 'juego', 'canje')),
    intento_id INT REFERENCES intento_trivia(intento_id) ON DELETE RESTRICT,
    partida_id INT REFERENCES partida_juego(partida_id) ON DELETE RESTRICT,
    carta_id INT REFERENCES carta(carta_id) ON DELETE RESTRICT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (
            origen = 'trivia'
            AND cantidad > 0
            AND intento_id IS NOT NULL
            AND partida_id IS NULL
            AND carta_id IS NULL
        )
        OR
        (
            origen = 'juego'
            AND cantidad > 0
            AND partida_id IS NOT NULL
            AND intento_id IS NULL
            AND carta_id IS NULL
        )
        OR
        (
            origen = 'canje'
            AND cantidad = -100
            AND carta_id IS NOT NULL
            AND intento_id IS NULL
            AND partida_id IS NULL
        )
    )
);

CREATE UNIQUE INDEX uq_puntos_trivia
ON movimiento_puntos(intento_id)
WHERE origen = 'trivia';

CREATE UNIQUE INDEX uq_puntos_juego
ON movimiento_puntos(partida_id)
WHERE origen = 'juego';

CREATE UNIQUE INDEX uq_canje_carta_usuario
ON movimiento_puntos(usuario_id, carta_id)
WHERE origen = 'canje';

CREATE INDEX idx_usuario_favorito
ON usuario(equipo_favorito_id);

CREATE INDEX idx_recurso_equipo
ON recurso_equipo(equipo_id);

CREATE INDEX idx_estadistica_equipo
ON estadistica_deportiva(equipo_id);

CREATE INDEX idx_pregunta_trivia_equipo
ON pregunta_trivia(trivia_id, equipo_id);

CREATE INDEX idx_opcion_pregunta
ON opcion_respuesta(pregunta_id);

CREATE INDEX idx_intento_usuario
ON intento_trivia(usuario_id);

CREATE INDEX idx_respuesta_intento
ON respuesta_usuario(intento_id);

CREATE INDEX idx_partida_usuario
ON partida_juego(usuario_id);

CREATE INDEX idx_foto_usuario
ON foto_usuario(usuario_id);

CREATE INDEX idx_usuario_carta
ON usuario_carta(usuario_id);

CREATE INDEX idx_movimiento_usuario
ON movimiento_puntos(usuario_id);

CREATE VIEW vista_saldo_puntos AS
SELECT
    u.usuario_id,
    u.nombre,
    COALESCE(SUM(m.cantidad), 0)::BIGINT AS saldo
FROM usuario u
LEFT JOIN movimiento_puntos m
    ON u.usuario_id = m.usuario_id
GROUP BY u.usuario_id, u.nombre;

CREATE VIEW vista_coleccion_usuario AS
SELECT
    u.usuario_id,
    c.carta_id,
    c.titulo,
    c.descripcion,
    c.imagen_url,
    e.equipo_id,
    e.nombre AS equipo,
    uc.obtenida_en
FROM usuario_carta uc
JOIN usuario u
    ON uc.usuario_id = u.usuario_id
JOIN carta c
    ON uc.carta_id = c.carta_id
JOIN equipo e
    ON c.equipo_id = e.equipo_id;

CREATE VIEW vista_progreso_cartas AS
SELECT
    u.usuario_id,
    u.nombre,
    COUNT(uc.carta_id) AS cartas_obtenidas,
    (SELECT COUNT(*) FROM carta) AS cartas_disponibles
FROM usuario u
LEFT JOIN usuario_carta uc
    ON u.usuario_id = uc.usuario_id
GROUP BY u.usuario_id, u.nombre;

CREATE FUNCTION canjear_carta_aleatoria(
    p_usuario_id INT
)
RETURNS TABLE (
    carta_obtenida_id INT,
    equipo_obtenido_id INT,
    saldo_restante BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_saldo BIGINT;
    v_carta_id INT;
    v_equipo_id INT;
BEGIN

    PERFORM 1
    FROM usuario
    WHERE usuario_id = p_usuario_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    SELECT COALESCE(SUM(cantidad), 0)
    INTO v_saldo
    FROM movimiento_puntos
    WHERE usuario_id = p_usuario_id;

    IF v_saldo < 100 THEN
        RAISE EXCEPTION 'Puntos insuficientes';
    END IF;

    SELECT c.carta_id, c.equipo_id
    INTO v_carta_id, v_equipo_id
    FROM carta c
    WHERE NOT EXISTS (
        SELECT 1
        FROM usuario_carta uc
        WHERE uc.usuario_id = p_usuario_id
          AND uc.carta_id = c.carta_id
    )
    ORDER BY RANDOM()
    LIMIT 1;

    IF v_carta_id IS NULL THEN
        RAISE EXCEPTION 'Coleccion completa';
    END IF;

    INSERT INTO usuario_carta (
        usuario_id,
        carta_id
    )
    VALUES (
        p_usuario_id,
        v_carta_id
    );

    INSERT INTO movimiento_puntos (
        usuario_id,
        cantidad,
        origen,
        carta_id
    )
    VALUES (
        p_usuario_id,
        -100,
        'canje',
        v_carta_id
    );

    RETURN QUERY
    SELECT
        v_carta_id,
        v_equipo_id,
        v_saldo - 100;

END;
$$;

COMMIT;