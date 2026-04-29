const QRCode = require("qrcode");

async function generateQR(url) {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF"
    }
  });
}

module.exports = generateQR;