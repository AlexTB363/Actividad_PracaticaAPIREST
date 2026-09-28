require("dotenv").config();

const express = require("express");

const inicioController = require("./controllers/inicio.controller");
const productosController = require("./controllers/productos.controller");
const usuariosController = require("./controllers/usuarios.controller");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Rutas iniciales
app.get("/", inicioController.inicio);
app.get("/marco", inicioController.marco);
app.get("/ping", inicioController.ping);

// Rutas de productos
app.get("/productos", productosController.listar);
app.get("/productos/:id", productosController.obtener);
app.post("/productos", productosController.crear);
app.put("/productos/:id", productosController.actualizar);
app.delete("/productos/:id", productosController.eliminar);

// Rutas de usuarios y login
app.get("/users", usuariosController.listar);
app.post("/users", usuariosController.registrar);
app.post("/login", usuariosController.login);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});