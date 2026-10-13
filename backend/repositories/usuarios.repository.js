const { sql, getPool } = require("../database");
function createUsuariosRepository(poolProvider = getPool) {
  async function listar() {
    const pool = await poolProvider();
    const result = await pool.request().query(
      "SELECT id, nombre, email, fecha_creacion FROM dbo.Usuarios ORDER BY id"
    );
    return result.recordset;
  }
  async function buscarPorEmail(email) {
    const pool = await poolProvider();
    const result = await pool.request().input("email", sql.NVarChar(254), email).query(
      "SELECT id, nombre, email, password_hash FROM dbo.Usuarios WHERE email = @email"
    );
    return result.recordset[0];
  }
  async function crear({ nombre, email, passwordHash }) {
    const pool = await poolProvider();
    const result = await pool.request()
      .input("nombre", sql.NVarChar(100), nombre)
      .input("email", sql.NVarChar(254), email)
      .input("passwordHash", sql.VarChar(512), passwordHash)
      .query(`INSERT INTO dbo.Usuarios (nombre, email, password_hash)
        OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.email
        VALUES (@nombre, @email, @passwordHash)`);
    return result.recordset[0];
  }
  return { listar, buscarPorEmail, crear };
}
module.exports = { ...createUsuariosRepository(), createUsuariosRepository };
