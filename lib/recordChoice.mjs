async function recordChoice(writeOnce, payload) {
  try {
    await writeOnce({ ...payload, matched: true });
    return true;
  } catch (error) {
    if (!error || error.code !== "PERMISSION_DENIED") throw error;
    await writeOnce({ ...payload, matched: false });
    return false;
  }
}

export { recordChoice };
