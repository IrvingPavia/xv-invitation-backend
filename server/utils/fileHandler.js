const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/families.json");

function readData() {
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
  readData,
  writeData
};