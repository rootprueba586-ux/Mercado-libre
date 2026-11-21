#!/usr/bin/env node
// Arranque completo desde Tabby: Docker (si puede) → migrate → seed → dev.
// Si Docker no arranca (WSL/virtualización) pero DATABASE_URL ya responde, sigue igual.
import { spawn, spawnSync } from 'node:child_process';
import pg from 'pg';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    // npm.cmd en Windows necesita shell; docker y node no.
    shell: process.platform === 'win32' && command === 'npm',
    ...options,
  });
  return result.status ?? 1;
}

async function databaseReady() {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

console.log('→ Intentando docker compose up -d --wait…');
const dockerStatus = run('docker', ['compose', 'up', '-d', '--wait']);

if (dockerStatus !== 0) {
  const ready = await databaseReady();
  if (!ready) {
    console.error(`
Docker no pudo levantar PostgreSQL y DATABASE_URL tampoco responde.

En esta máquina suele faltar:
  1. Virtualización habilitada en el firmware (BIOS/UEFI)
  2. WSL2 / "Plataforma de máquina virtual"
  3. Docker Desktop con el motor en verde (Engine running)

Mientras tanto, si ya tienes PostgreSQL en el puerto del .env con usuario app/app
y bases app + app_test, crea/ajusta .env y vuelve a ejecutar: npm run up
`);
    process.exit(1);
  }
  console.log('→ Docker no disponible; PostgreSQL local ya responde. Continúo.');
}

if (run('npm', ['run', 'migrate']) !== 0) process.exit(1);
if (run('npm', ['run', 'seed']) !== 0) process.exit(1);

console.log('→ npm run dev');
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.on('exit', (code) => process.exit(code ?? 1));
