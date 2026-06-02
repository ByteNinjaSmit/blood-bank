const mongoose = require('mongoose');

let cached = null;

async function supportsTransactions() {
  if (cached !== null) return cached;
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return false;
    }
    const admin = mongoose.connection.db.admin();
    const res = await admin.command({ hello: 1 });
    cached = Boolean(res && res.setName) || res?.msg === 'isdbgrid';
    return cached;
  } catch (err) {
    try {
      const admin = mongoose.connection?.db?.admin?.();
      if (!admin) {
        return false;
      }
      const res = await admin.command({ isMaster: 1 });
      cached = Boolean(res && res.setName) || res?.msg === 'isdbgrid';
      return cached;
    } catch (_) {
      cached = false;
      return cached;
    }
  }
}

module.exports = { supportsTransactions };
