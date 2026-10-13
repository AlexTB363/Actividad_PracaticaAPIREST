const { randomBytes, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const deriveKey = promisify(scrypt);
const OPTIONS = { N: 65536, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };
const PREFIX = "scrypt$v1$65536$8$1$";

function isPasswordHash(value) {
  return typeof value === "string" &&
    /^scrypt\$v1\$65536\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(value);
}

async function hashPassword(password) {
  if (typeof password !== "string" || !password.length) {
    throw new TypeError("La contraseña debe ser un texto no vacío");
  }
  const salt = randomBytes(16);
  const hash = await deriveKey(password, salt, 64, OPTIONS);
  return `${PREFIX}${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  if (typeof password !== "string" || !isPasswordHash(stored)) return false;
  const parts = stored.split("$");
  const calculated = await deriveKey(password, Buffer.from(parts[5], "hex"), 64, OPTIONS);
  return timingSafeEqual(calculated, Buffer.from(parts[6], "hex"));
}
module.exports = { hashPassword, verifyPassword, isPasswordHash };
