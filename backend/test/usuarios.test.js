const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { createUsuariosController } = require("../controllers/usuarios.controller");
const { isPasswordHash, verifyPassword } = require("../security/passwords");

test("API: registro, login, datos inválidos, duplicados y respuestas sin contraseña", async (t) => {
  const usuarios = [];
  const repository = {
    async crear({ nombre, email, passwordHash }) {
      if (usuarios.some((u) => u.email === email)) throw { number: 2627 };
      const usuario = { id: usuarios.length + 1, nombre, email, password_hash: passwordHash };
      usuarios.push(usuario);
      return { id: usuario.id, nombre, email };
    },
    async buscarPorEmail(email) { return usuarios.find((u) => u.email === email); },
    async listar() { return usuarios.map(({ password_hash, ...u }) => u); },
  };
  const controller = createUsuariosController(repository);
  const app = express();
  app.use(express.json());
  app.post("/api/users", controller.registrar);
  app.get("/api/users", controller.listar);
  app.post("/api/login", controller.login);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const credentials = { nombre: " Alumno ", email: " Alumno@ejemplo.com ", password: "Clave segura 🔐 " };
  let response = await post("/api/users", credentials);
  assert.equal(response.status, 201);
  let body = await response.json();
  assert.deepEqual(body.usuario, { id: 1, nombre: "Alumno", email: "alumno@ejemplo.com" });
  assert.ok(isPasswordHash(usuarios[0].password_hash));
  assert.equal(await verifyPassword(credentials.password, usuarios[0].password_hash), true);
  assert.equal((await post("/api/users", credentials)).status, 409);
  for (const invalid of [{}, { ...credentials, password: {} }, { ...credentials, password: "x".repeat(1025) },
    { ...credentials, email: "inválido" }, { ...credentials, nombre: " " }]) {
    assert.equal((await post("/api/users", invalid)).status, 400);
  }
  response = await post("/api/login", credentials);
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal("password_hash" in body.usuario, false);
  assert.equal("password" in body.usuario, false);
  response = await post("/api/login", { ...credentials, password: "incorrecta" });
  assert.equal(response.status, 401);
  const wrong = await response.json();
  response = await post("/api/login", { ...credentials, email: "ausente@ejemplo.com" });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), wrong);
  assert.equal((await post("/api/login", {})).status, 400);
  response = await fetch(base + "/api/users");
  assert.deepEqual(await response.json(), [{ id: 1, nombre: "Alumno", email: "alumno@ejemplo.com" }]);
  repository.buscarPorEmail = async () => { throw new Error("Detalle interno"); };
  response = await post("/api/login", credentials);
  assert.equal(response.status, 500);
  assert.equal(JSON.stringify(await response.json()).includes("Detalle interno"), false);
});
