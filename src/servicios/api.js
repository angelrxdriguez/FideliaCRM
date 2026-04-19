async function procesarRespuesta(respuesta, mensajePorDefecto) {
  const payload = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    throw new Error(payload.mensaje || mensajePorDefecto)
  }

  return payload
}

export async function obtener(url, mensajePorDefecto = 'No se pudo completar la consulta.') {
  const respuesta = await fetch(url)
  return procesarRespuesta(respuesta, mensajePorDefecto)
}

export async function enviar(url, body, mensajePorDefecto = 'No se pudo enviar la informacion.') {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return procesarRespuesta(respuesta, mensajePorDefecto)
}
