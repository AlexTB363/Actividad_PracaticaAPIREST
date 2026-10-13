const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { sql, getPool, closePool } = require("../database");
const { createUsuariosRepository } = require("../repositories/usuarios.repository");
const { createUsuariosController } = require("../controllers/usuarios.controller");
const { isPasswordHash } = require("../security/passwords");

function response() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function main() {
  let transaction;
  let begun = false;
  try {
    transaction = new sql.Transaction(await getPool());
    await transaction.begin();
    begun = true;
    const repository = createUsuariosRepository(async () => transaction);
    const controller = createUsuariosController(repository);
    const credentials = { nombre: "Prueba temporal", email: `test-${randomUUID()}@ejemplo.com`, password: randomUUID() };
    const registration = response();
    await controller.registrar({ body: credentials }, registration);
    assert.equal(registration.code, 201);
    const stored = await repository.buscarPorEmail(credentials.email);
    assert.ok(isPasswordHash(stored.password_hash));
    assert.notEqual(stored.password_hash, credentials.password);
    const login = response();
    await controller.login({ body: credentials }, login);
    assert.equal(login.code, 200);
    assert.equal(login.body.usuario.email, credentials.email);
    assert.equal("password_hash" in login.body.usuario, false);
    const wrong = response();
    await controller.login({ body: { ...credentials, password: "incorrecta" } }, wrong);
    assert.equal(wrong.code, 401);
    const users = await repository.listar();
    assert.ok(users.some((user) => user.id === stored.id));
    assert.ok(users.every((user) => !("password_hash" in user)));
    console.log("SQL Server: registro, almacenamiento scrypt, login correcto/incorrecto y listado verificados.");
  } finally {
    if (begun) await transaction.rollback();
    await closePool();
  }
  console.log("Transacción revertida: no se conservaron usuarios de prueba.");
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
