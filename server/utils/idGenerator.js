function generateNextId(existingFamilies) {
    const last = existingFamilies
      .map(f => Number(f.id.replace("INV_", "")))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a)[0] || 0;
  
    const next = last + 1;
    return `INV_${String(next).padStart(4, "0")}`;
  }
  
  module.exports = { generateNextId };
  