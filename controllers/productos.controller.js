function listar(req, res) {
  res.json({
    mensaje: "Aquí consultaremos todos los productos",
  });
}

function obtener(req, res) {
  const id = req.params.id;

  res.json({
    mensaje: "Aquí consultaremos un producto",
    id: id,
  });
}

function crear(req, res) {
  const datos = req.body;

  res.json({
    mensaje: "Datos recibidos para crear un producto",
    datos: datos,
  });
}

function actualizar(req, res) {
  const id = req.params.id;
  const datos = req.body;

  res.json({
    mensaje: "Datos recibidos para actualizar un producto",
    id: id,
    datos: datos,
  });
}

function eliminar(req, res) {
  const id = req.params.id;

  res.json({
    mensaje: "Solicitud recibida para eliminar un producto",
    id: id,
  });
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
};