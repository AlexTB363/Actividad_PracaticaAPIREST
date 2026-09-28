function listar(req, res) {
  res.json({
    mensaje: "Aquí consultaremos los usuarios",
  });
}

function registrar(req, res) {
  const { nombre, email, password } = req.body || {};

  if (!nombre || !email || !password) {
    return res.status(400).json({
      mensaje: "Debes enviar nombre, email y password",
    });
  }

  res.json({
    mensaje: "Datos recibidos; registro pendiente de implementar",
    usuario: {
      nombre,
      email,
    },
  });
}

function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      mensaje: "Debes enviar email y password",
    });
  }

  res.json({
    mensaje: "Credenciales recibidas; verificación pendiente de implementar",
  });
}

module.exports = {
  listar,
  registrar,
  login,
};