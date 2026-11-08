
const pool = require('../config/db');

const columnasEquipo = `
  e.equipo_id,
  e.nombre,
  e.ciudad,
  e.descripcion,
  e.historia,
  e.logo_url,
  e.target_index_e,
  rm.archivo_url AS modelo_url,

  COALESCE((
    SELECT json_agg(
      json_build_object(
        'multimedia_id', r.multimedia_id,
        'titulo', r.titulo,
        'archivo_url', r.archivo_url
      )
      ORDER BY r.multimedia_id
    )
    FROM recurso_equipo re
    JOIN recurso_multimedia r
      ON r.multimedia_id = re.multimedia_id
    WHERE re.equipo_id = e.equipo_id
      AND r.tipo_recurso = 'modelo_3d'
  ), '[]'::json) AS modelos,

  s.temporada,
  s.juegos_jugados,
  s.victorias,
  s.derrotas,
  s.carreras_anotadas,
  s.carreras_permitidas,
  s.posicion,

  CASE
    WHEN s.victorias + s.derrotas > 0
    THEN ROUND(
      s.victorias::NUMERIC /
      (s.victorias + s.derrotas),
      3
    )
    ELSE NULL
  END AS porcentaje_victorias
`;

const relacionesEquipo = `
  FROM equipo e

  LEFT JOIN recurso_multimedia rm
    ON rm.multimedia_id = e.modelo_ar_id
   AND rm.tipo_recurso = 'modelo_3d'

  LEFT JOIN estadistica_equipo s
    ON s.equipo_id = e.equipo_id
   AND s.temporada = 2026
   AND s.fase = 'regular'
`;

async function obtenerEquiposAR() {
  const resultado = await pool.query(`
    SELECT ${columnasEquipo}
    ${relacionesEquipo}
    WHERE e.target_index_e BETWEEN 0 AND 14
    ORDER BY e.target_index_e
  `);

  return resultado.rows;
}

async function obtenerEquipoPorTarget(targetIndex) {
  const resultado = await pool.query(`
    SELECT ${columnasEquipo}
    ${relacionesEquipo}
    WHERE e.target_index_e = $1
  `, [targetIndex]);

  return resultado.rows[0] || null;
}

module.exports = {
  obtenerEquiposAR,
  obtenerEquipoPorTarget
};
