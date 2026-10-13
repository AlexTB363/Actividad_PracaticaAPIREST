const { sql, getPool, closePool } = require("../database");
const { hashPassword, isPasswordHash } = require("../security/passwords");
async function migratePasswords(pool, driver = sql) {
  const transaction = new driver.Transaction(pool);
  await transaction.begin(driver.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const { recordset } = await new driver.Request(transaction).query(
      "SELECT id, password_hash FROM dbo.Usuarios WITH (UPDLOCK, HOLDLOCK)"
    );
    let updated = 0;
    for (const usuario of recordset) {
      if (isPasswordHash(usuario.password_hash)) continue;
      // No interpretar hashes previos o dañados como contraseñas en texto plano.
      if (!usuario.password_hash || usuario.password_hash.startsWith("scrypt$") ||
          usuario.password_hash.startsWith("$2") ||
          /^[a-f0-9]{32,128}$/i.test(usuario.password_hash)) {
        throw new Error(`Usuario ${usuario.id}: formato ambiguo; requiere restablecer su contraseña`);
      }
      const hashed = await hashPassword(usuario.password_hash);
      await new driver.Request(transaction)
        .input("id", driver.Int, usuario.id)
        .input("hash", driver.VarChar(512), hashed)
        .query("UPDATE dbo.Usuarios SET password_hash = @hash WHERE id = @id");
      updated++;
    }
    await transaction.commit();
    return { updated, skipped: recordset.length - updated };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
if (require.main === module) {
  (async () => {
    try {
      const result = await migratePasswords(await getPool());
      console.log(`Contraseñas actualizadas: ${result.updated}. Ya seguras: ${result.skipped}.`);
    } catch (error) {
      console.error("No se completó la migración:", error.message);
      process.exitCode = 1;
    } finally {
      await closePool();
    }
  })();
}
module.exports = { migratePasswords };
