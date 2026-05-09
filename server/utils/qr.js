const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../qrs");

function ensureDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function generateQR(invitationId, url) {
  ensureDir();

  const filePath = path.join(OUTPUT_DIR, `${invitationId}.png`);

  await QRCode.toFile(filePath, url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF"
    }
  });

  return filePath;
}

module.exports = { generateQR };