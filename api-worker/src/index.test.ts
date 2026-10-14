import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { mock, test } from 'node:test';
import { crearManejador, type Guardar, type Verificar } from './index.ts';
import { entregarValana } from './entregas-valana.ts';

const env = {
  DB: {} as D1Database,
  TURNSTILE_SECRET_KEY: 'solo-pruebas',
  TURNSTILE_HOSTNAMES: 'localhost',
  ORIGENES_PERMITIDOS: 'http://localhost:4321',
};
const filas: Array<{ tabla: string; fila: Record<string, string | number | null> }> = [];
const guardar: Guardar = async (tabla, fila) => { filas.push({ tabla, fila }); return filas.length; };
const verificar: Verificar = async (token, accion) => token === 'token-valido' &&
  (accion === 'postulacion' || accion === 'contacto');
const manejar = crearManejador(guardar, verificar);
const base = 'https://api.ejemplo.test';
const origen = 'http://localhost:4321';
const post = (ruta: string, cuerpo: object, origin = origen) => new Request(base + ruta, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
  body: JSON.stringify(cuerpo),
});
const datosPostulacion = {
  studentName: 'Ana Pérez', studentAge: '10', grade: 'primaria_5',
  parentName: 'Luis Pérez', parentPhone: '+51 976 586 016',
  parentEmail: 'luis@example.com', preferredContact: 'whatsapp', language: 'es',
  turnstileToken: 'token-valido',
};
const datosFichaNueva = {
  studentFirstNames: 'Ana María', studentPaternalSurname: 'Pérez',
  studentMaternalSurname: 'García', previousSchool: 'Colegio de ejemplo',
  studentAge: '10', grade: 'primaria_5',
  parentName: 'Luis Pérez', parentRelationship: 'Padre', parentPhone: '+51 976 586 016',
  parentEmail: 'luis@example.com', preferredContact: 'whatsapp', language: 'es',
  turnstileToken: 'token-valido',
};
const datosContacto = {
  name: 'Luis Pérez', email: 'luis@example.com', phone: '',
  subject: 'Vacantes', message: 'Quisiera información', language: 'es',
  turnstileToken: 'token-valido',
};

test('salud', async () => {
  const r = await manejar(new Request(base + '/api/salud'), env);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, servicio: 'boston-api' });
});
test('postulación válida mapea a columnas españolas', async () => {
  filas.length = 0;
  const r = await manejar(post('/api/postulaciones', datosPostulacion), env);
  assert.equal(r.status, 201);
  assert.equal(filas[0].tabla, 'postulaciones');
  assert.equal(filas[0].fila.grado, 'primaria_5');
  assert.equal(filas[0].fila.medio_contacto, 'whatsapp');
  assert.equal(filas[0].fila.origen, 'web');
  assert.equal('turnstileToken' in filas[0].fila, false);
});
test('ficha nueva conserva los datos separados y el nombre compatible con Valana', async () => {
  filas.length = 0;
  const r = await manejar(post('/api/postulaciones', datosFichaNueva), env);
  assert.equal(r.status, 201);
  assert.equal(filas[0].fila.nombre_estudiante, 'Ana María Pérez García');
  assert.equal(filas[0].fila.nombres_estudiante, 'Ana María');
  assert.equal(filas[0].fila.apellido_paterno_estudiante, 'Pérez');
  assert.equal(filas[0].fila.apellido_materno_estudiante, 'García');
  assert.equal(filas[0].fila.institucion_procedencia, 'Colegio de ejemplo');
  assert.equal(filas[0].fila.parentesco_apoderado, 'Padre');
});
test('cada estudiante genera una postulación nueva con el mismo apoderado', async () => {
  filas.length = 0;
  const segundo = { ...datosFichaNueva, studentFirstNames: 'Sofía', studentAge: '8', grade: 'primaria_3' };
  assert.equal((await manejar(post('/api/postulaciones', datosFichaNueva), env)).status, 201);
  assert.equal((await manejar(post('/api/postulaciones', segundo), env)).status, 201);
  assert.equal(filas.length, 2);
  assert.deepEqual(filas.map(({fila}) => fila.nombre_estudiante), ['Ana María Pérez García', 'Sofía Pérez García']);
  assert.equal(filas[0].fila.correo_apoderado, filas[1].fila.correo_apoderado);
});
test('la migración 0004 guarda la ficha nueva y crea una entrega pendiente', async () => {
  const sqlite = new DatabaseSync(':memory:');
  for (const archivo of ['0001_inicial.sql', '0002_pendiente_evaluacion.sql',
    '0003_entregas_valana.sql', '0004_datos_admision.sql']) {
    sqlite.exec(readFileSync(new URL(`../migrations/${archivo}`, import.meta.url), 'utf8'));
  }
  const localDb = {
    prepare(sql: string) {
      return { bind(...valores: Array<string | number | null>) {
        return {
          async first() { return sqlite.prepare(sql).get(...valores) ?? null; },
          async run() {
            const resultado = sqlite.prepare(sql).run(...valores);
            return { meta: { last_row_id: Number(resultado.lastInsertRowid) } };
          },
        };
      } };
    },
  } as unknown as D1Database;
  const local = crearManejador(undefined, verificar, async () => {});
  const r = await local(post('/api/postulaciones', datosFichaNueva), { ...env, DB: localDb });
  assert.equal(r.status, 201);
  assert.deepEqual({ ...sqlite.prepare(`SELECT nombre_estudiante, nombres_estudiante,
    apellido_paterno_estudiante, apellido_materno_estudiante, institucion_procedencia,
    parentesco_apoderado FROM postulaciones`).get() }, {
    nombre_estudiante: 'Ana María Pérez García', nombres_estudiante: 'Ana María',
    apellido_paterno_estudiante: 'Pérez', apellido_materno_estudiante: 'García',
    institucion_procedencia: 'Colegio de ejemplo', parentesco_apoderado: 'Padre',
  });
  const segundo = { ...datosFichaNueva, studentFirstNames: 'Sofía', studentAge: '8', grade: 'primaria_3' };
  assert.equal((await local(post('/api/postulaciones', segundo), { ...env, DB: localDb })).status, 201);
  assert.equal((await local(post('/api/postulaciones', datosPostulacion), { ...env, DB: localDb })).status, 201);
  assert.equal(sqlite.prepare('SELECT count(*) AS total FROM postulaciones').get()?.total, 3);
  assert.equal(sqlite.prepare('SELECT count(*) AS total FROM entregas_valana').get()?.total, 3);

  const ids = sqlite.prepare('SELECT id FROM postulaciones ORDER BY id').all().map((fila) => Number(fila.id));
  const cuerpos: Array<Record<string, unknown>> = [];
  const tokenPrivado = 'x'.repeat(32);
  const fetchSimulado = mock.method(globalThis, 'fetch', async (
    url: Parameters<typeof fetch>[0], options?: Parameters<typeof fetch>[1],
  ) => {
    assert.equal(String(url), 'https://valana.example.test/integraciones/boston/formularios');
    assert.equal(options?.method, 'POST');
    assert.equal((options?.headers as Record<string, string>).Authorization, `Bearer ${tokenPrivado}`);
    cuerpos.push(JSON.parse(String(options?.body)) as Record<string, unknown>);
    return new Response(null, { status: 201 });
  });
  try {
    const entornoValana = { DB: localDb, VALANA_API_URL: 'https://valana.example.test',
      VALANA_INTEGRATION_TOKEN: tokenPrivado };
    await entregarValana(entornoValana, 'postulacion', ids[0]);
    await entregarValana(entornoValana, 'postulacion', ids[1]);
    await entregarValana(entornoValana, 'postulacion', ids[2]);
  } finally {
    fetchSimulado.mock.restore();
  }
  assert.deepEqual(cuerpos.map(({ tipo, id, nombre_estudiante }) => ({ tipo, id, nombre_estudiante })), [
    { tipo: 'postulacion', id: ids[0], nombre_estudiante: 'Ana María Pérez García' },
    { tipo: 'postulacion', id: ids[1], nombre_estudiante: 'Sofía Pérez García' },
    { tipo: 'postulacion', id: ids[2], nombre_estudiante: 'Ana Pérez' },
  ]);
  for (const cuerpo of cuerpos.slice(0, 2)) {
    assert.equal(cuerpo.nombres_estudiante === 'Ana María' || cuerpo.nombres_estudiante === 'Sofía', true);
    assert.equal(cuerpo.apellido_paterno_estudiante, 'Pérez');
    assert.equal(cuerpo.apellido_materno_estudiante, 'García');
    assert.equal(cuerpo.institucion_procedencia, 'Colegio de ejemplo');
    assert.equal(cuerpo.parentesco_apoderado, 'Padre');
    assert.equal(cuerpo.telefono_apoderado, '+51 976 586 016');
    assert.equal('turnstileToken' in cuerpo, false);
  }
  for (const campo of ['nombres_estudiante', 'apellido_paterno_estudiante',
    'apellido_materno_estudiante', 'institucion_procedencia', 'parentesco_apoderado']) {
    assert.equal(cuerpos[2][campo], null);
  }
  assert.equal(sqlite.prepare('SELECT count(*) AS total FROM entregas_valana WHERE entregada_en IS NOT NULL').get()?.total, 3);
  sqlite.close();
});
for (const [nombre, cambios] of [
  ['nombres', { studentFirstNames: '' }],
  ['apellido paterno', { studentPaternalSurname: '' }],
  ['institución', { previousSchool: '' }],
  ['parentesco', { parentRelationship: '' }],
] as const) {
  test(`ficha nueva rechaza ${nombre} vacío`, async () => {
    filas.length = 0;
    const r = await manejar(post('/api/postulaciones', { ...datosFichaNueva, ...cambios }), env);
    assert.equal(r.status, 400);
    assert.equal(filas.length, 0);
  });
}
for (const [nombre, cambios] of [
  ['requerido', { studentName: '' }],
  ['email', { parentEmail: 'invalido' }],
  ['edad', { studentAge: '30' }],
  ['medio', { preferredContact: 'telegram' }],
  ['grado', { grade: '7' }],
  ['Turnstile ausente', { turnstileToken: '' }],
] as const) {
  test(`postulación rechaza ${nombre}`, async () => {
    filas.length = 0;
    const r = await manejar(post('/api/postulaciones', { ...datosPostulacion, ...cambios }), env);
    assert.equal(r.status, 400);
    assert.equal(filas.length, 0);
  });
}
test('Turnstile inválido impide guardar', async () => {
  filas.length = 0;
  const r = await manejar(post('/api/postulaciones', { ...datosPostulacion, turnstileToken: 'falso' }), env);
  assert.equal(r.status, 403);
  assert.equal(filas.length, 0);
});
test('contacto válido', async () => {
  filas.length = 0;
  const r = await manejar(post('/api/contactos', datosContacto), env);
  assert.equal(r.status, 201);
  assert.equal(filas[0].tabla, 'contactos_web');
  assert.equal(filas[0].fila.telefono, null);
  assert.equal(filas[0].fila.origen, 'web');
});
test('entrega el ID persistido a Valana sin exponerlo en la respuesta pública', async () => {
  filas.length = 0;
  const entregas: Array<{tipo:string;id:number}> = [];
  const conEntrega = crearManejador(guardar, verificar, async (_entorno,tipo,id) => {
    entregas.push({tipo,id});
  });
  const r = await conEntrega(post('/api/contactos', datosContacto), env);
  assert.equal(r.status, 201);
  assert.deepEqual(await r.json(), {ok:true});
  assert.deepEqual(entregas, [{tipo:'contacto',id:1}]);
});
test('un fallo temporal de Valana no convierte en fallido el formulario ya guardado', async () => {
  filas.length = 0;
  const conFallo = crearManejador(guardar, verificar, async () => {
    throw new Error('Valana no disponible');
  });
  const r = await conFallo(post('/api/postulaciones', datosPostulacion), env);
  assert.equal(r.status, 201);
  assert.equal(filas.length, 1);
});
test('contacto inválido', async () => {
  filas.length = 0;
  const r = await manejar(post('/api/contactos', { ...datosContacto, message: 'x' }), env);
  assert.equal(r.status, 400);
  assert.equal(filas.length, 0);
});
test('contacto sin Turnstile', async () => {
  const { turnstileToken: _omitido, ...sinToken } = datosContacto;
  const r = await manejar(post('/api/contactos', sinToken), env);
  assert.equal(r.status, 400);
});
test('CORS OPTIONS permitido', async () => {
  const r = await manejar(new Request(base + '/api/contactos', {
    method: 'OPTIONS', headers: { Origin: origen },
  }), env);
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), origen);
});
test('CORS OPTIONS permite el dominio institucional de producción', async () => {
  const productionOrigin = 'https://bostonbbs.com';
  const r = await manejar(new Request(base + '/api/contactos', {
    method: 'OPTIONS', headers: { Origin: productionOrigin },
  }), { ...env, ORIGENES_PERMITIDOS: productionOrigin });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), productionOrigin);
});
test('CORS rechaza otro origen', async () => {
  const r = await manejar(post('/api/contactos', datosContacto, 'https://otro.example'), env);
  assert.equal(r.status, 403);
});
test('sin configuración no guarda', async () => {
  const r = await manejar(post('/api/contactos', datosContacto), { ...env, TURNSTILE_SECRET_KEY: '' });
  assert.equal(r.status, 503);
});
test('rechaza cuerpo grande y tipo incorrecto', async () => {
  const grande = await manejar(post('/api/contactos', { ...datosContacto, message: 'x'.repeat(9000) }), env);
  assert.equal(grande.status, 413);
  const tipo = await manejar(new Request(base + '/api/contactos', {
    method: 'POST', headers: { Origin: origen, 'Content-Type': 'text/plain' }, body: '{}',
  }), env);
  assert.equal(tipo.status, 415);
});
test('ruta inexistente', async () => {
  const r = await manejar(new Request(base + '/api/desconocida'), env);
  assert.equal(r.status, 404);
});
test('no expone detalles internos de D1', async () => {
  const fallo = crearManejador(async () => { throw new Error('SQL privado'); }, verificar);
  const r = await fallo(post('/api/contactos', datosContacto), env);
  assert.equal(r.status, 500);
  assert.doesNotMatch(await r.text(), /SQL privado/);
});
