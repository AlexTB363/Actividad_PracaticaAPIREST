const { hashPassword, verifyPassword } = require("../security/passwords");
const { randomBytes } = require("node:crypto");

function validCredentials(email, password) {
  return typeof email === "string" && email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    typeof password === "string" && password.length > 0 &&
    Buffer.byteLength(password, "utf8") <= 1024;
}

function createUsuariosController(repository) {
  // También realiza scrypt cuando el correo no existe.
  let dummyHash;
  async function listar(req, res) {
    try {
      res.json(await repository.listar());
    } catch {
      res.status(500).json({ mensaje: "No se pudieron consultar los usuarios" });
    }
  }

  async function registrar(req, res) {
    const { nombre, email, password } = req.body || {};
    if (typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 100 ||
        !validCredentials(email, password)) {
      return res.status(400).json({ mensaje: "Debes enviar nombre, email válido y password (máximo 1024 bytes)" });
    }
    try {
      const passwordHash = await hashPassword(password);
      const usuario = await repository.crear({
        nombre: nombre.trim(), email: email.trim().toLowerCase(), passwordHash,
      });
      return res.status(201).json({ mensaje: "Usuario registrado", usuario });
    } catch (error) {
      if ([2601, 2627].includes(error.number) ||
          [2601, 2627].includes(error.originalError?.info?.number)) {
        return res.status(409).json({ mensaje: "El correo ya está registrado" });
      }
      return res.status(500).json({ mensaje: "No se pudo registrar el usuario" });
    }
  }

  async function login(req, res) {
    const { email, password } = req.body || {};
    if (!validCredentials(email, password)) {
      return res.status(400).json({ mensaje: "Debes enviar email válido y password (máximo 1024 bytes)" });
    }
    try {
      const usuario = await repository.buscarPorEmail(email.trim().toLowerCase());
      const storedHash = usuario?.password_hash ||
        await (dummyHash ||= hashPassword(randomBytes(32).toString("hex")));
      const matches = await verifyPassword(password, storedHash);
      if (!usuario || !matches) {
        return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
      }
      return res.json({
        mensaje: "Credenciales correctas",
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      });
    } catch {
      return res.status(500).json({ mensaje: "No se pudo verificar el inicio de sesión" });
    }
  }
  return { listar, registrar, login };
}
module.exports = {
  ...createUsuariosController(require("../repositories/usuarios.repository")),
  createUsuariosController,
};
