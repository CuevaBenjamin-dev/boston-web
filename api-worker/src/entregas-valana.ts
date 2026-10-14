type Tipo = 'postulacion' | 'contacto';
type Entorno = { DB:D1Database; VALANA_API_URL?:string; VALANA_INTEGRATION_TOKEN?:string };
type Pendiente = {tipo:Tipo;origen_id:number;intentos:number};

function configurado(env:Entorno):boolean {
  return Boolean(env.VALANA_API_URL?.startsWith('https://') && (env.VALANA_INTEGRATION_TOKEN?.length ?? 0) >= 32);
}

async function cargar(env:Entorno,tipo:Tipo,id:number):Promise<Record<string,unknown>|null> {
  if(tipo==='postulacion'){
    const fila=await env.DB.prepare(`SELECT id,fecha_creacion,idioma,nombre_estudiante,
      nombres_estudiante,apellido_paterno_estudiante,apellido_materno_estudiante,
      institucion_procedencia,parentesco_apoderado,edad_estudiante,grado,
      nombre_apoderado,telefono_apoderado,correo_apoderado,medio_contacto FROM postulaciones WHERE id=?`)
      .bind(id).first<Record<string,unknown>>();
    return fila?{tipo,...fila}:null;
  }
  const fila=await env.DB.prepare(`SELECT id,fecha_creacion,idioma,nombre,correo,telefono,asunto,mensaje
    FROM contactos_web WHERE id=?`).bind(id).first<Record<string,unknown>>();
  return fila?{tipo,...fila}:null;
}

export async function entregarValana(env:Entorno,tipo:Tipo,id:number):Promise<void> {
  if(!configurado(env))return;
  const fila=await cargar(env,tipo,id);
  if(!fila)return; // El registro original no se modifica; queda pendiente para revisión.
  let codigo=0;
  try{
    const respuesta=await fetch(`${env.VALANA_API_URL!.replace(/\/$/,'')}/integraciones/boston/formularios`,{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.VALANA_INTEGRATION_TOKEN}`},
      body:JSON.stringify(fila),signal:AbortSignal.timeout(5000),
    });
    codigo=respuesta.status;
    if(respuesta.ok){
      await env.DB.prepare(`UPDATE entregas_valana SET entregada_en=CURRENT_TIMESTAMP,ultimo_codigo=?
        WHERE tipo=? AND origen_id=? AND entregada_en IS NULL`).bind(codigo,tipo,id).run();
      return;
    }
  }catch { /* La fila pendiente permite reintentar sin perder el formulario. */ }
  const pendiente=await env.DB.prepare(`SELECT intentos FROM entregas_valana
    WHERE tipo=? AND origen_id=? AND entregada_en IS NULL`).bind(tipo,id).first<{intentos:number}>();
  if(!pendiente)return;
  const segundos=Math.min(3600,Math.pow(2,Math.min(pendiente.intentos,10))*30);
  await env.DB.prepare(`UPDATE entregas_valana SET intentos=intentos+1,ultimo_codigo=?,
    siguiente_intento=datetime('now',?) WHERE tipo=? AND origen_id=? AND entregada_en IS NULL`)
    .bind(codigo,`+${segundos} seconds`,tipo,id).run();
}

export async function entregarPendientes(env:Entorno):Promise<void> {
  if(!configurado(env))return;
  const pendientes=await env.DB.prepare(`SELECT tipo,origen_id,intentos FROM entregas_valana
    WHERE entregada_en IS NULL AND siguiente_intento<=CURRENT_TIMESTAMP
    ORDER BY siguiente_intento,tipo,origen_id LIMIT 20`).all<Pendiente>();
  for(let i=0;i<pendientes.results.length;i+=4){
    await Promise.allSettled(pendientes.results.slice(i,i+4).map(p=>entregarValana(env,p.tipo,p.origen_id)));
  }
}
