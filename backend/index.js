const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const express = require("express");

const inicioController = require("./controllers/inicio.controller");
const productosController = require("./controllers/productos.controller");
const usuariosController = require("./controllers/usuarios.controller");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Rutas de la API
app.get("/api", inicioController.inicio);
app.get("/api/marco", inicioController.marco);
app.get("/api/ping", inicioController.ping);

app.get("/api/productos", productosController.listar);
app.get("/api/productos/:id", productosController.obtener);
app.post("/api/productos", productosController.crear);
app.put("/api/productos/:id", productosController.actualizar);
app.delete("/api/productos/:id", productosController.eliminar);

app.get("/api/users", usuariosController.listar);
app.post("/api/users", usuariosController.registrar);
app.post("/api/login", usuariosController.login);

// Archivos del frontend
app.use(express.static(path.join(__dirname, "..", "public")));

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor disponible en http://localhost:${PORT}`);
    });
}
module.exports = app;
