const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const windowsAuth = process.env.DB_AUTH === "windows";
const sql = require(windowsAuth ? "mssql/msnodesqlv8" : "mssql");
let poolPromise;

async function getPool() {
  if (!process.env.DB_SERVER || !process.env.DB_DATABASE) {
    throw new Error("Configura DB_SERVER y DB_DATABASE en backend/.env");
  }
  if (!poolPromise) {
    const config = {
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      connectionTimeout: 10000,
      requestTimeout: 30000,
      options: {
        encrypt: true,
        trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === "true",
        trustedConnection: windowsAuth,
      },
    };
    if (windowsAuth) {
      const escapeOdbc = (value) => `{${value.replace(/}/g, "}}")}}`;
      const driver = process.env.DB_DRIVER || "ODBC Driver 17 for SQL Server";
      // Conserva la resolución local/de instancia y transmite el certificado al driver ODBC.
      config.connectionString = `Driver=${escapeOdbc(driver)};` +
        `Server=${escapeOdbc(config.server)};Database=${escapeOdbc(config.database)};` +
        `Trusted_Connection=Yes;Encrypt=Yes;` +
        `TrustServerCertificate=${config.options.trustServerCertificate ? "Yes" : "No"};`;
    } else {
      config.user = process.env.DB_USER;
      config.password = process.env.DB_PASSWORD;
    }
    const pool = new sql.ConnectionPool(config);
    pool.on("error", () => console.error("Error de conexión con SQL Server"));
    poolPromise = pool.connect().catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
}

async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise;
    poolPromise = undefined;
    await pool.close();
  }
}
module.exports = { sql, getPool, closePool };
