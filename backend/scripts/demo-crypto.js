const { createHash } = require("node:crypto");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword } = require("../security/passwords");
async function main() {
  const texto = "Hola mundo";
  const modificado = "Hola mundO";
  const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
  const primero = sha256(texto);
  const repetido = sha256(texto);
  const diferente = sha256(modificado);
  assert.equal(primero, repetido);
  assert.notEqual(primero, diferente);
  const changed = Buffer.from(diferente, "hex");
  const bits = Buffer.from(primero, "hex").reduce((total, byte, index) =>
    total + (byte ^ changed[index]).toString(2).replace(/0/g, "").length, 0);
  console.log(`Texto: ${texto}\nSHA-256: ${primero}\nRepetido: ${repetido}`);
  console.log(`Texto modificado: ${modificado}\nSHA-256: ${diferente}\nCambian ${bits} de 256 bits.`);
  const a = await hashPassword(texto);
  const b = await hashPassword(texto);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(texto, a), true);
  assert.equal(await verifyPassword(modificado, a), false);
  console.log(`scrypt con sal A: ${a}\nscrypt con sal B: ${b}`);
  console.log("Misma contraseña + sales distintas = hashes distintos. Login verificado.");
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
