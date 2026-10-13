const test = require("node:test");
const assert = require("node:assert/strict");
const { sql } = require("../database");
const { migratePasswords } = require("../scripts/migrate-passwords");
const { hashPassword, verifyPassword } = require("../security/passwords");

function fakeDatabase(rows, failUpdate = false) {
  const state = { rows: structuredClone(rows), committed: false, rolledBack: false, updates: 0 };
  class Transaction {
    async begin() { this.pending = structuredClone(state.rows); }
    async commit() { state.rows = this.pending; state.committed = true; }
    async rollback() { state.rolledBack = true; }
  }
  class Request {
    constructor(transaction) { this.transaction = transaction; this.parameters = {}; }
    input(name, type, value) { this.parameters[name] = value; return this; }
    async query(query) {
      if (query.startsWith("SELECT")) return { recordset: this.transaction.pending };
      if (failUpdate) throw new Error("Fallo simulado al actualizar");
      const row = this.transaction.pending.find((u) => u.id === this.parameters.id);
      row.password_hash = this.parameters.hash;
      state.updates++;
      return { rowsAffected: [1] };
    }
  }
  state.driver = { Transaction, Request, Int: sql.Int, VarChar: sql.VarChar, ISOLATION_LEVEL: sql.ISOLATION_LEVEL };
  return state;
}

test("migración: convierte texto plano, conserva hashes y puede repetirse", async () => {
  const secure = await hashPassword("Ya segura");
  const state = fakeDatabase([{ id: 1, password_hash: "Clave anterior!" }, { id: 2, password_hash: secure }]);
  assert.deepEqual(await migratePasswords({}, state.driver), { updated: 1, skipped: 1 });
  assert.equal(state.committed, true);
  assert.equal(await verifyPassword("Clave anterior!", state.rows[0].password_hash), true);
  assert.equal(state.rows[1].password_hash, secure);
  assert.deepEqual(await migratePasswords({}, state.driver), { updated: 0, skipped: 2 });
  assert.equal(state.updates, 1);
});

test("migración: revierte todas las actualizaciones ante un formato ambiguo", async () => {
  const original = [{ id: 1, password_hash: "Clave anterior!" }, { id: 2, password_hash: "scrypt$dañado" }];
  const state = fakeDatabase(original);
  await assert.rejects(migratePasswords({}, state.driver), /formato ambiguo/);
  assert.equal(state.rolledBack, true);
  assert.equal(state.committed, false);
  assert.deepEqual(state.rows, original);
});

test("migración: revierte la transacción si SQL Server rechaza una actualización", async () => {
  const original = [{ id: 1, password_hash: "Clave anterior!" }];
  const state = fakeDatabase(original, true);
  await assert.rejects(migratePasswords({}, state.driver), /Fallo simulado/);
  assert.equal(state.rolledBack, true);
  assert.deepEqual(state.rows, original);
});
