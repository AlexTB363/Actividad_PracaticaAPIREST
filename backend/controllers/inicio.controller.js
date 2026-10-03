function inicio(req, res) {
  res.send("Bienvenido a mi REST-API");
}

function marco(req, res) {
  res.send("polo");
}

function ping(req, res) {
  res.send("pong");
}

module.exports = {
  inicio,
  marco,
  ping,
};