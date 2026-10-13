const test = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword, isPasswordHash } = require("../security/passwords");

test("misma contraseña con sales diferentes y verificación correcta", async () => {
  const password = "Contraseña con espacios 🔐 ";
  const a = await hashPassword(password);
  const b = await hashPassword(password);
  assert.ok(isPasswordHash(a));
  assert.notEqual(a.split("$")[5], b.split("$")[5]);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword(password.trim(), a), false);
  assert.equal(await verifyPassword("incorrecta", a), false);
});

test("rechaza texto plano, hashes truncados, parámetros alterados y tipos inválidos", async () => {
  const hash = await hashPassword("secreto");
  for (const value of ["secreto", hash.slice(0, -1), hash.replace("65536", "2"), null]) {
    assert.equal(await verifyPassword("secreto", value), false);
  }
  assert.equal(await verifyPassword({}, hash), false);
  await assert.rejects(hashPassword(""), TypeError);
});
