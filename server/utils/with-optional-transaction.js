const mongoose = require('mongoose');
const { supportsTransactions } = require('./mongo-transactions');

async function withOptionalTransaction(work) {
  const canUseTransactions = await supportsTransactions();

  if (!canUseTransactions) {
    return work(null);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await work(session);
    if (session.inTransaction()) {
      await session.commitTransaction();
    }
    return result;
  } catch (err) {
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (_) {
      // ignore abort errors
    }
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = { withOptionalTransaction };
