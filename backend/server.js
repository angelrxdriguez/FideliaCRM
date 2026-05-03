import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { configuracionConexion, pool } from './db/conexion.js'

const app = express()
const puerto = Number(process.env.PUERTO_API || 3101)
const tablasEsperadas = ['articulos', 'familias', 'tipo_familia', 'roles_usuarios', 'usuarios', 'tarifas', 'clientes']

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

app.post('/api/auth/login', async (req, res) => {
  const { correo, password } = req.body

  if (!correo || !password) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Correo y password son obligatorios.',
    })
  }

  try {
    const [usuarios] = await pool.query(
      `
        SELECT
          u.id,
          u.nombre_completo,
          u.correo,
          u.password,
          r.nombre AS rol
        FROM usuarios u
        LEFT JOIN roles_usuarios r ON r.id = u.rol_id
        WHERE u.correo = ?
        LIMIT 1
      `,
      [correo.trim().toLowerCase()]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales incorrectas.',
      })
    }

    const usuario = usuarios[0]
    const passwordValida = await bcrypt.compare(password, usuario.password)

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Credenciales incorrectas.',
      })
    }

    return res.json({
      ok: true,
      mensaje: 'Acceso concedido.',
      usuario: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    })
  } catch (error) {
    return enviarError(res, error, 'No se pudo iniciar sesion.')
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
          SELECT
            f.id,
            f.nombre,
            f.descripcion,
            tf.nombre AS tipo
          FROM familias f
          INNER JOIN tipo_familia tf ON tf.id = f.id_tipo
          ORDER BY f.id DESC
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
        SELECT
          u.id,
          u.rol_id,
          u.nombre_completo,
          u.correo,
          r.nombre AS rol
        FROM usuarios u
        LEFT JOIN roles_usuarios r ON r.id = u.rol_id
        ORDER BY u.id DESC
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
  const { rol_id, nombre_completo, correo, password } = req.body

  if (!nombre_completo || !correo || !password) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Nombre, correo y password son obligatorios.',
    })
  }

  try {
    if (rol_id) {
      const [roles] = await pool.query(
        `
          SELECT id, nombre
          FROM roles_usuarios
          WHERE id = ?
          LIMIT 1
        `,
        [Number(rol_id)]
      )

      if (roles.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'El rol indicado no existe.',
        })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const [resultado] = await pool.query(
      `
        INSERT INTO usuarios (rol_id, nombre_completo, correo, password)
        VALUES (?, ?, ?, ?)
      `,
      [rol_id ? Number(rol_id) : null, nombre_completo.trim(), correo.trim().toLowerCase(), passwordHash]
    )

    let rol = null

    if (rol_id) {
      const [roles] = await pool.query(
        `
          SELECT nombre
          FROM roles_usuarios
          WHERE id = ?
          LIMIT 1
        `,
        [Number(rol_id)]
      )

      rol = roles[0]?.nombre || null
    }

    res.status(201).json({
      ok: true,
      mensaje: 'Usuario creado correctamente.',
      usuario: {
        id: resultado.insertId,
        rol_id: rol_id ? Number(rol_id) : null,
        rol,
        nombre_completo: nombre_completo.trim(),
        correo: correo.trim().toLowerCase(),
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear el usuario.')
  }
})

app.put('/api/usuarios/:id', async (req, res) => {
  const usuarioId = Number(req.params.id)
  const { rol_id, nombre_completo, correo, password } = req.body
  const nombreNormalizado = typeof nombre_completo === 'string' ? nombre_completo.trim() : ''
  const correoNormalizado = typeof correo === 'string' ? correo.trim().toLowerCase() : ''
  const rolIdNormalizado = rol_id ? Number(rol_id) : null

  if (!Number.isInteger(usuarioId) || usuarioId <= 0 || !nombreNormalizado || !correoNormalizado) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El usuario, nombre y correo son obligatorios.',
    })
  }

  try {
    const [usuarios] = await pool.query(
      `
        SELECT id
        FROM usuarios
        WHERE id = ?
        LIMIT 1
      `,
      [usuarioId]
    )

    if (usuarios.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El usuario indicado no existe.',
      })
    }

    if (rolIdNormalizado !== null) {
      const [roles] = await pool.query(
        `
          SELECT id
          FROM roles_usuarios
          WHERE id = ?
          LIMIT 1
        `,
        [rolIdNormalizado]
      )

      if (roles.length === 0) {
        return res.status(404).json({
          ok: false,
          mensaje: 'El rol indicado no existe.',
        })
      }
    }

    const passwordNormalizada = typeof password === 'string' ? password.trim() : ''

    if (passwordNormalizada) {
      const passwordHash = await bcrypt.hash(passwordNormalizada, 12)

      await pool.query(
        `
          UPDATE usuarios
          SET
            rol_id = ?,
            nombre_completo = ?,
            correo = ?,
            password = ?
          WHERE id = ?
        `,
        [rolIdNormalizado, nombreNormalizado, correoNormalizado, passwordHash, usuarioId]
      )
    } else {
      await pool.query(
        `
          UPDATE usuarios
          SET
            rol_id = ?,
            nombre_completo = ?,
            correo = ?
          WHERE id = ?
        `,
        [rolIdNormalizado, nombreNormalizado, correoNormalizado, usuarioId]
      )
    }

    let rol = null

    if (rolIdNormalizado !== null) {
      const [roles] = await pool.query(
        `
          SELECT nombre
          FROM roles_usuarios
          WHERE id = ?
          LIMIT 1
        `,
        [rolIdNormalizado]
      )
      rol = roles[0]?.nombre || null
    }

    return res.json({
      ok: true,
      mensaje: 'Usuario actualizado correctamente.',
      usuario: {
        id: usuarioId,
        rol_id: rolIdNormalizado,
        rol,
        nombre_completo: nombreNormalizado,
        correo: correoNormalizado,
      },
    })
  } catch (error) {
    return enviarError(res, error, 'No se pudo actualizar el usuario.')
  }
})

app.get('/api/roles-usuarios', async (_req, res) => {
  try {
    const [roles] = await pool.query(
      `
        SELECT
          r.id,
          r.nombre,
          r.descripcion,
          COUNT(u.id) AS total_usuarios
        FROM roles_usuarios r
        LEFT JOIN usuarios u ON u.rol_id = r.id
        GROUP BY r.id, r.nombre, r.descripcion
        ORDER BY r.nombre ASC
      `
    )

    res.json({
      ok: true,
      roles,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener los roles de usuario.')
  }
})

app.post('/api/roles-usuarios', async (req, res) => {
  const { nombre, descripcion } = req.body

  if (!nombre) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre del rol es obligatorio.',
    })
  }

  try {
    const [resultado] = await pool.query(
      `
        INSERT INTO roles_usuarios (nombre, descripcion)
        VALUES (?, ?)
      `,
      [nombre.trim(), descripcion?.trim() || null]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Rol creado correctamente.',
      rol: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear el rol de usuario.')
  }
})

const camposEmpresa = [
  'nombre_comercial',
  'razon_social',
  'cif',
  'telefono',
  'email',
  'web',
  'direccion_fiscal',
  'direccion_social',
  'ciudad',
  'provincia',
  'codigo_postal',
  'pais',
]

const tablasEmpresaCandidatas = [
  'parametros_empresa',
  'empresa_parametros',
  'configuracion_empresa',
  'empresa_configuracion',
  'datos_empresa',
]

const aliasCamposEmpresa = {
  nombre_comercial: ['nombre_comercial', 'nombre_empresa', 'nombre'],
  razon_social: ['razon_social'],
  cif: ['cif', 'nif'],
  telefono: ['telefono', 'telefono_principal'],
  email: ['email', 'correo'],
  web: ['web', 'sitio_web'],
  direccion_fiscal: ['direccion_fiscal', 'direccion'],
  direccion_social: ['direccion_social', 'direccion'],
  ciudad: ['ciudad'],
  provincia: ['provincia'],
  codigo_postal: ['codigo_postal', 'cp'],
  pais: ['pais'],
}

function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return null
  }

  const normalizado = valor.trim()
  return normalizado || null
}

function escaparIdentificador(identificador) {
  return `\`${String(identificador || '').replace(/`/g, '')}\``
}

async function obtenerDefinicionTablaEmpresa() {
  const placeholders = tablasEmpresaCandidatas.map(() => '?').join(', ')

  const [tablas] = await pool.query(
    `
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN (${placeholders})
    `,
    [configuracionConexion.database, ...tablasEmpresaCandidatas]
  )

  if (tablas.length === 0) {
    return null
  }

  const nombresTablas = tablas.map((item) => item.TABLE_NAME)
  const nombreTabla =
    tablasEmpresaCandidatas.find((nombreCandidata) => nombresTablas.includes(nombreCandidata)) || nombresTablas[0]

  const [columnas] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
    `,
    [configuracionConexion.database, nombreTabla]
  )

  const columnasDisponibles = new Set(columnas.map((item) => item.COLUMN_NAME))
  const mapaCampos = {}

  for (const campo of camposEmpresa) {
    const aliases = aliasCamposEmpresa[campo] || [campo]
    const columnaDetectada = aliases.find((alias) => columnasDisponibles.has(alias))

    if (columnaDetectada) {
      mapaCampos[campo] = columnaDetectada
    }
  }

  return {
    nombreTabla,
    columnasDisponibles,
    mapaCampos,
    tieneId: columnasDisponibles.has('id'),
  }
}

app.get('/api/empresa-parametros', async (_req, res) => {
  try {
    const definicion = await obtenerDefinicionTablaEmpresa()

    const baseVacia = {
      id: 1,
      nombre_comercial: '',
      razon_social: '',
      cif: '',
      telefono: '',
      email: '',
      web: '',
      direccion_fiscal: '',
      direccion_social: '',
      ciudad: '',
      provincia: '',
      codigo_postal: '',
      pais: '',
    }

    if (!definicion) {
      return res.json({
        ok: true,
        parametros: baseVacia,
      })
    }

    const columnasSelect = []

    if (definicion.tieneId) {
      columnasSelect.push(`${escaparIdentificador('id')} AS id`)
    }

    for (const campo of camposEmpresa) {
      const columna = definicion.mapaCampos[campo]
      if (columna) {
        columnasSelect.push(`${escaparIdentificador(columna)} AS ${escaparIdentificador(campo)}`)
      }
    }

    if (columnasSelect.length === 0) {
      return res.json({
        ok: true,
        parametros: baseVacia,
      })
    }

    const consulta = `
      SELECT ${columnasSelect.join(', ')}
      FROM ${escaparIdentificador(definicion.nombreTabla)}
      ${definicion.tieneId ? 'WHERE id = 1' : ''}
      LIMIT 1
    `

    const [filas] = await pool.query(consulta)
    const fila = filas[0] || {}

    return res.json({
      ok: true,
      parametros: {
        ...baseVacia,
        ...fila,
      },
    })
  } catch (error) {
    return enviarError(res, error, 'No se pudieron obtener los parametros de empresa.')
  }
})

app.put('/api/empresa-parametros', async (req, res) => {
  try {
    const definicion = await obtenerDefinicionTablaEmpresa()

    if (!definicion) {
      return res.status(409).json({
        ok: false,
        mensaje: 'No existe la tabla de parametros de empresa en la base de datos.',
      })
    }

    const datosNormalizados = {}

    for (const campo of camposEmpresa) {
      datosNormalizados[campo] = normalizarTexto(req.body?.[campo])
    }

    const valoresPorColumna = new Map()

    for (const campo of camposEmpresa) {
      const columna = definicion.mapaCampos[campo]
      if (!columna) {
        continue
      }

      const valor = datosNormalizados[campo]
      if (!valoresPorColumna.has(columna)) {
        valoresPorColumna.set(columna, valor)
        continue
      }

      if (valoresPorColumna.get(columna) === null && valor !== null) {
        valoresPorColumna.set(columna, valor)
      }
    }

    const columnasFisicas = [...valoresPorColumna.keys()]

    if (columnasFisicas.length > 0) {
      if (definicion.tieneId) {
        const columnasInsert = ['id', ...columnasFisicas]
        const placeholders = columnasInsert.map(() => '?').join(', ')
        const updates = columnasFisicas
          .map((columna) => `${escaparIdentificador(columna)} = VALUES(${escaparIdentificador(columna)})`)
          .join(', ')

        const consulta = `
          INSERT INTO ${escaparIdentificador(definicion.nombreTabla)} (${columnasInsert
            .map((columna) => escaparIdentificador(columna))
            .join(', ')})
          VALUES (${placeholders})
          ON DUPLICATE KEY UPDATE ${updates}
        `

        await pool.query(consulta, [1, ...columnasFisicas.map((columna) => valoresPorColumna.get(columna))])
      } else {
        const setClause = columnasFisicas
          .map((columna) => `${escaparIdentificador(columna)} = ?`)
          .join(', ')
        const valores = columnasFisicas.map((columna) => valoresPorColumna.get(columna))
        const consultaUpdate = `
          UPDATE ${escaparIdentificador(definicion.nombreTabla)}
          SET ${setClause}
          LIMIT 1
        `

        const [resultadoUpdate] = await pool.query(consultaUpdate, valores)

        if (resultadoUpdate.affectedRows === 0) {
          const consultaInsert = `
            INSERT INTO ${escaparIdentificador(definicion.nombreTabla)} (${columnasFisicas
              .map((columna) => escaparIdentificador(columna))
              .join(', ')})
            VALUES (${columnasFisicas.map(() => '?').join(', ')})
          `
          await pool.query(consultaInsert, valores)
        }
      }
    }

    return res.json({
      ok: true,
      mensaje: 'Parametros de empresa actualizados correctamente.',
      parametros: {
        id: 1,
        ...datosNormalizados,
      },
    })
  } catch (error) {
    return enviarError(res, error, 'No se pudieron guardar los parametros de empresa.')
  }
})

app.get('/api/tarifas', async (_req, res) => {
  try {
    const [tarifas] = await pool.query(
      `
        SELECT
          t.id,
          t.nombre,
          t.porcentaje_beneficio,
          t.activa,
          COUNT(c.id) AS total_clientes
        FROM tarifas t
        LEFT JOIN clientes c ON c.id_tarifa = t.id
        GROUP BY t.id, t.nombre, t.porcentaje_beneficio, t.activa
        ORDER BY t.nombre ASC
      `
    )

    res.json({
      ok: true,
      tarifas,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener las tarifas.')
  }
})

app.post('/api/tarifas', async (req, res) => {
  const { nombre, porcentaje_beneficio, activa } = req.body
  const porcentajeNormalizado = Number(porcentaje_beneficio)

  if (!nombre || Number.isNaN(porcentajeNormalizado)) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre y el porcentaje de beneficio son obligatorios.',
    })
  }

  try {
    const [resultado] = await pool.query(
      `
        INSERT INTO tarifas (nombre, porcentaje_beneficio, activa)
        VALUES (?, ?, ?)
      `,
      [nombre.trim(), porcentajeNormalizado, activa ? 1 : 0]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Tarifa creada correctamente.',
      tarifa: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        porcentaje_beneficio: porcentajeNormalizado,
        activa: activa ? 1 : 0,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear la tarifa.')
  }
})

app.put('/api/tarifas/:id', async (req, res) => {
  const tarifaId = Number(req.params.id)
  const { nombre, porcentaje_beneficio, activa } = req.body
  const nombreNormalizado = typeof nombre === 'string' ? nombre.trim() : ''
  const porcentajeNormalizado = Number(porcentaje_beneficio)

  if (!Number.isInteger(tarifaId) || tarifaId <= 0 || !nombreNormalizado || Number.isNaN(porcentajeNormalizado)) {
    return res.status(400).json({
      ok: false,
      mensaje: 'La tarifa, el nombre y el porcentaje son obligatorios.',
    })
  }

  try {
    const [tarifas] = await pool.query(
      `
        SELECT id
        FROM tarifas
        WHERE id = ?
        LIMIT 1
      `,
      [tarifaId]
    )

    if (tarifas.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'La tarifa indicada no existe.',
      })
    }

    await pool.query(
      `
        UPDATE tarifas
        SET
          nombre = ?,
          porcentaje_beneficio = ?,
          activa = ?
        WHERE id = ?
      `,
      [nombreNormalizado, porcentajeNormalizado, activa ? 1 : 0, tarifaId]
    )

    res.json({
      ok: true,
      mensaje: 'Tarifa actualizada correctamente.',
      tarifa: {
        id: tarifaId,
        nombre: nombreNormalizado,
        porcentaje_beneficio: porcentajeNormalizado,
        activa: activa ? 1 : 0,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo actualizar la tarifa.')
  }
})

app.get('/api/clientes', async (_req, res) => {
  try {
    const [clientes] = await pool.query(
      `
        SELECT
          c.id,
          c.nombre,
          c.cif,
          c.telefono,
          c.email,
          c.id_tarifa,
          c.activo,
          t.nombre AS tarifa
        FROM clientes c
        INNER JOIN tarifas t ON t.id = c.id_tarifa
        ORDER BY c.id DESC
      `
    )

    res.json({
      ok: true,
      clientes,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener los clientes.')
  }
})

app.post('/api/clientes', async (req, res) => {
  const {
    nombre,
    nombre_fiscal,
    cif,
    telefono,
    email,
    direccion,
    ciudad,
    provincia,
    codigo_postal,
    latitud,
    longitud,
    id_tarifa,
    id_comercial,
    activo,
  } = req.body
  const tarifaId = Number(id_tarifa)

  if (!nombre || !Number.isInteger(tarifaId) || tarifaId <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre y la tarifa son obligatorios.',
    })
  }

  try {
    const [tarifas] = await pool.query(
      `
        SELECT id, nombre
        FROM tarifas
        WHERE id = ?
        LIMIT 1
      `,
      [tarifaId]
    )

    if (tarifas.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'La tarifa indicada no existe.',
      })
    }

    const [resultado] = await pool.query(
      `
        INSERT INTO clientes (
          nombre,
          nombre_fiscal,
          cif,
          telefono,
          email,
          direccion,
          ciudad,
          provincia,
          codigo_postal,
          latitud,
          longitud,
          id_tarifa,
          id_comercial,
          activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre.trim(),
        nombre_fiscal?.trim() || null,
        cif?.trim() || null,
        telefono?.trim() || null,
        email?.trim() || null,
        direccion?.trim() || null,
        ciudad?.trim() || null,
        provincia?.trim() || null,
        codigo_postal?.trim() || null,
        latitud !== '' && latitud !== null && latitud !== undefined ? Number(latitud) : null,
        longitud !== '' && longitud !== null && longitud !== undefined ? Number(longitud) : null,
        tarifaId,
        id_comercial ? Number(id_comercial) : null,
        activo ? 1 : 0,
      ]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Cliente creado correctamente.',
      cliente: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        id_tarifa: tarifaId,
        tarifa: tarifas[0].nombre,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear el cliente.')
  }
})

app.get('/api/codigos-postales/:cp', async (req, res) => {
  const cp = String(req.params.cp || '').trim()

  if (!/^\d{5}$/.test(cp)) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El codigo postal debe tener 5 digitos.',
    })
  }

  try {
    const respuesta = await fetch(`https://api.zippopotam.us/es/${cp}`)

    if (respuesta.status === 404) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontro informacion para ese codigo postal.',
      })
    }

    if (!respuesta.ok) {
      throw new Error(`Servicio externo devolvio estado ${respuesta.status}`)
    }

    const payload = await respuesta.json()
    const lugares = Array.isArray(payload.places) ? payload.places : []

    if (lugares.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'No se encontraron localidades para ese codigo postal.',
      })
    }

    const provincia = lugares[0].state || null
    const ciudades = [...new Set(lugares.map((lugar) => lugar['place name']).filter(Boolean))]

    res.json({
      ok: true,
      codigo_postal: cp,
      provincia,
      ciudades,
      ciudad_principal: ciudades[0] || null,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo consultar el codigo postal.')
  }
})

app.get('/api/familias', async (_req, res) => {
  try {
    const [familias] = await pool.query(
      `
        SELECT
          f.id,
          f.id_tipo,
          f.nombre,
          f.descripcion,
          tf.nombre AS tipo,
          COUNT(a.id) AS total_articulos
        FROM familias f
        INNER JOIN tipo_familia tf ON tf.id = f.id_tipo
        LEFT JOIN articulos a ON a.familia_id = f.id
        GROUP BY f.id, f.id_tipo, f.nombre, f.descripcion, tf.nombre
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
  const { id_tipo, nombre, descripcion } = req.body

  if (!id_tipo || !nombre) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El tipo y el nombre de la familia son obligatorios.',
    })
  }

  try {
    const [tiposFamilia] = await pool.query(
      `
        SELECT id, nombre
        FROM tipo_familia
        WHERE id = ?
        LIMIT 1
      `,
      [Number(id_tipo)]
    )

    if (tiposFamilia.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El tipo de familia indicado no existe.',
      })
    }

    const [resultado] = await pool.query(
      `
        INSERT INTO familias (id_tipo, nombre, descripcion)
        VALUES (?, ?, ?)
      `,
      [Number(id_tipo), nombre.trim(), descripcion?.trim() || null]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Familia creada correctamente.',
      familia: {
        id: resultado.insertId,
        id_tipo: Number(id_tipo),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        tipo: tiposFamilia[0].nombre,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear la familia.')
  }
})

app.get('/api/tipos-familia', async (_req, res) => {
  try {
    const [tiposFamilia] = await pool.query(
      `
        SELECT
          tf.id,
          tf.nombre,
          tf.descripcion,
          COUNT(f.id) AS total_familias
        FROM tipo_familia tf
        LEFT JOIN familias f ON f.id_tipo = tf.id
        GROUP BY tf.id, tf.nombre, tf.descripcion
        ORDER BY tf.nombre ASC
      `
    )

    res.json({
      ok: true,
      tiposFamilia,
    })
  } catch (error) {
    enviarError(res, error, 'No se pudieron obtener los tipos de familia.')
  }
})

app.post('/api/tipos-familia', async (req, res) => {
  const { nombre, descripcion } = req.body

  if (!nombre) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El nombre del tipo de familia es obligatorio.',
    })
  }

  try {
    const [resultado] = await pool.query(
      `
        INSERT INTO tipo_familia (nombre, descripcion)
        VALUES (?, ?)
      `,
      [nombre.trim(), descripcion?.trim() || null]
    )

    res.status(201).json({
      ok: true,
      mensaje: 'Tipo de familia creado correctamente.',
      tipoFamilia: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo crear el tipo de familia.')
  }
})

app.get('/api/articulos', async (_req, res) => {
  try {
    const [familias] = await pool.query(
      `
        SELECT
          f.id,
          f.id_tipo,
          f.nombre,
          f.descripcion,
          tf.nombre AS tipo
        FROM familias f
        INNER JOIN tipo_familia tf ON tf.id = f.id_tipo
        ORDER BY f.nombre ASC
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
          f.nombre AS familia,
          tf.nombre AS tipo_familia
        FROM articulos a
        INNER JOIN familias f ON f.id = a.familia_id
        INNER JOIN tipo_familia tf ON tf.id = f.id_tipo
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

app.put('/api/articulos/:id', async (req, res) => {
  const articuloId = Number(req.params.id)
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
  const familiaId = Number(familia_id)
  const nombreNormalizado = typeof nombre === 'string' ? nombre.trim() : ''
  const descripcionNormalizada = typeof descripcion === 'string' ? descripcion.trim() || null : null
  const skuNormalizado = typeof sku === 'string' ? sku.trim() || null : null
  const formatoNormalizado = typeof formato === 'string' ? formato.trim() || null : null
  const unidadNormalizada = typeof unidad_medida === 'string' ? unidad_medida.trim() || null : null
  const precioNormalizado = Number(precio_base || 0)
  const stockNormalizado = Number(stock || 0)
  const activoNormalizado = activo ? 1 : 0

  if (!Number.isInteger(articuloId) || articuloId <= 0 || !Number.isInteger(familiaId) || familiaId <= 0 || !nombreNormalizado) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El articulo, la familia y el nombre son obligatorios.',
    })
  }

  try {
    const [articulos] = await pool.query(
      `
        SELECT id
        FROM articulos
        WHERE id = ?
        LIMIT 1
      `,
      [articuloId]
    )

    const [familias] = await pool.query(
      `
        SELECT id
        FROM familias
        WHERE id = ?
        LIMIT 1
      `,
      [familiaId]
    )

    if (articulos.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El articulo indicado no existe.',
      })
    }

    if (familias.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: 'La familia indicada no existe.',
      })
    }

    await pool.query(
      `
        UPDATE articulos
        SET
          familia_id = ?,
          nombre = ?,
          descripcion = ?,
          sku = ?,
          formato = ?,
          unidad_medida = ?,
          precio_base = ?,
          stock = ?,
          activo = ?
        WHERE id = ?
      `,
      [
        familiaId,
        nombreNormalizado,
        descripcionNormalizada,
        skuNormalizado,
        formatoNormalizado,
        unidadNormalizada,
        precioNormalizado,
        stockNormalizado,
        activoNormalizado,
        articuloId,
      ]
    )

    res.json({
      ok: true,
      mensaje: 'Articulo actualizado correctamente.',
      articulo: {
        id: articuloId,
      },
    })
  } catch (error) {
    enviarError(res, error, 'No se pudo actualizar el articulo.')
  }
})

app.listen(puerto, () => {
  console.log(`API disponible en http://127.0.0.1:${puerto}`)
})
