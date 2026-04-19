import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { configuracionConexion, pool } from './db/conexion.js'

const app = express()
const puerto = Number(process.env.PUERTO_API || 3101)
const tablasEsperadas = ['articulos', 'familias', 'usuarios']

app.use(cors())
app.use(express.json())

function enviarError(res, error, mensajeBase) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      ok: false,
      mensaje: 'Ya existe un registro con ese valor unico.',
      detalle: error.message,
    })
  }

  return res.status(500).json({
    ok: false,
    mensaje: mensajeBase,
    detalle: error.message,
  })
}

async function obtenerTablasDisponibles() {
  const [tablasDisponibles] = await pool.query(
    `
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
    `,
    [configuracionConexion.database]
  )

  return tablasDisponibles.map((tabla) => tabla.TABLE_NAME)
}

async function validarEsquemaBase() {
  const nombresTablas = await obtenerTablasDisponibles()
  return tablasEsperadas.filter((tabla) => !nombresTablas.includes(tabla))
}

app.get('/api/salud', async (_req, res) => {
  try {
    await pool.query('SELECT 1 AS ok')

    res.json({
      ok: true,
      mensaje: 'Conexion correcta con MySQL.',
      baseDeDatos: configuracionConexion.database,
      servidor: `${configuracionConexion.host}:${configuracionConexion.port}`,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo conectar con MySQL.')
  }
})

app.get('/api/inicio', async (_req, res) => {
  try {
    const tablasFaltantes = await validarEsquemaBase()

    if (tablasFaltantes.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: 'La base de datos existe, pero faltan tablas del esquema inicial.',
        tablasFaltantes,
      })
    }

    const [
      [filasConteoArticulos],
      [filasConteoFamilias],
      [filasConteoUsuarios],
      [articulos],
      [familias],
      [usuarios],
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM articulos'),
      pool.query('SELECT COUNT(*) AS total FROM familias'),
      pool.query('SELECT COUNT(*) AS total FROM usuarios'),
      pool.query(
        `
          SELECT
            a.id,
            a.nombre,
            a.sku,
            a.stock,
            a.precio_base,
            a.activo,
            f.nombre AS familia
          FROM articulos a
          LEFT JOIN familias f ON f.id = a.familia_id
          ORDER BY a.id DESC
          LIMIT 8
        `
      ),
      pool.query(
        `
          SELECT id, nombre, descripcion
          FROM familias
          ORDER BY id DESC
          LIMIT 6
        `
      ),
      pool.query(
        `
          SELECT id, nombre_completo, correo
          FROM usuarios
          ORDER BY id DESC
          LIMIT 6
        `
      ),
    ])

    res.json({
      ok: true,
      mensaje: 'Datos cargados correctamente.',
      conexion: {
        baseDeDatos: configuracionConexion.database,
        servidor: `${configuracionConexion.host}:${configuracionConexion.port}`,
      },
      resumen: {
        articulos: filasConteoArticulos[0].total,
        familias: filasConteoFamilias[0].total,
        usuarios: filasConteoUsuarios[0].total,
      },
      articulos,
      familias,
      usuarios,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener los datos del inicio.')
  }
})

app.get('/api/usuarios', async (_req, res) => {
  try {
    const [usuarios] = await pool.query(
      `
        SELECT id, nombre_completo, correo
        FROM usuarios
        ORDER BY id DESC
      `
    )

    res.json({
      ok: true,
      usuarios,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener los usuarios.')
  }
})

app.post('/api/usuarios', async (req, res) => {
  const { nombre_completo, correo, password } = req.body

  if (!nombre_completo || !correo || !password) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Nombre, correo y password son obligatorios.',
    })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)

    const [resultado] = await pool.query(
      `
        INSERT INTO usuarios (nombre_completo, correo, password)
        VALUES (?, ?, ?)
      `,
      [nombre_completo.trim(), correo.trim().toLowerCase(), passwordHash]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Usuario creado correctamente.',
      usuario: {
        id: resultado.insertId,
        nombre_completo: nombre_completo.trim(),
        correo: correo.trim().toLowerCase(),
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear el usuario.')
  }
})

app.get('/api/familias', async (_req, res) => {
  try {
    const [familias] = await pool.query(
      `
        SELECT
          f.id,
          f.nombre,
          f.descripcion,
          COUNT(a.id) AS total_articulos
        FROM familias f
        LEFT JOIN articulos a ON a.familia_id = f.id
        GROUP BY f.id, f.nombre, f.descripcion
        ORDER BY f.nombre ASC
      `
    )

    res.json({
      ok: true,
      familias,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener las familias.')
  }
})

app.post('/api/familias', async (req, res) => {
  const { nombre, descripcion } = req.body

  if (!nombre) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre de la familia es obligatorio.',
    })
  }

  try {
    const [resultado] = await pool.query(
      `
        INSERT INTO familias (nombre, descripcion)
        VALUES (?, ?)
      `,
      [nombre.trim(), descripcion?.trim() || null]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Familia creada correctamente.',
      familia: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear la familia.')
  }
})

app.get('/api/articulos', async (_req, res) => {
  try {
    const [familias] = await pool.query(
      `
        SELECT id, nombre, descripcion
        FROM familias
        ORDER BY nombre ASC
      `
    )

    const [articulos] = await pool.query(
      `
        SELECT
          a.id,
          a.familia_id,
          a.nombre,
          a.descripcion,
          a.sku,
          a.formato,
          a.unidad_medida,
          a.precio_base,
          a.stock,
          a.activo,
          f.nombre AS familia
        FROM articulos a
        INNER JOIN familias f ON f.id = a.familia_id
        ORDER BY f.nombre ASC, a.nombre ASC
      `
    )

    const familiasConArticulos = familias.map((familia) => ({
      ...familia,
      articulos: [],
    }))

    const mapaFamilias = new Map(familiasConArticulos.map((familia) => [familia.id, familia]))

    for (const articulo of articulos) {
      const familia = mapaFamilias.get(articulo.familia_id)

      if (familia) {
        familia.articulos.push(articulo)
      }
    }

    res.json({
      ok: true,
      articulos,
      familias: familiasConArticulos,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener los articulos.')
  }
})

app.post('/api/articulos', async (req, res) => {
  const {
    familia_id,
    nombre,
    descripcion,
    sku,
    formato,
    unidad_medida,
    precio_base,
    stock,
    activo,
  } = req.body

  if (!familia_id || !nombre) {
    return res.status(400).json({
      ok: false,
      mensaje: 'La familia y el nombre del articulo son obligatorios.',
    })
  }

  try {
    const [familias] = await pool.query(
      `
        SELECT id
        FROM familias
        WHERE id = ?
        LIMIT 1
      `,
      [Number(familia_id)]
    )

    if (familias.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'La familia indicada no existe.',
      })
    }

    const [resultado] = await pool.query(
      `
        INSERT INTO articulos (
          familia_id,
          nombre,
          descripcion,
          sku,
          formato,
          unidad_medida,
          precio_base,
          stock,
          activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(familia_id),
        nombre.trim(),
        descripcion?.trim() || null,
        sku?.trim() || null,
        formato?.trim() || null,
        unidad_medida?.trim() || null,
        Number(precio_base || 0),
        Number(stock || 0),
        activo ? 1 : 0,
      ]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Articulo creado correctamente.',
      articulo: {
        id: resultado.insertId,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear el articulo.')
  }
})

app.listen(puerto, () => {
  console.log(`API disponible en http://127.0.0.1:${puerto}`)
})
