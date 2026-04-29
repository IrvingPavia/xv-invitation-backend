const express = require("express");
const fs = require("fs");
const path = require("path");
const generateQR = require("../utils/qrGenerator");

const router = express.Router();
const dataPath = path.join(__dirname, "../data/families.json");

// Helper
const readData = () =>
  JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const writeData = data =>
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

/**
 * GET /api/invitations/:id
 * Obtener datos de familia
 */
router.get("/:id", (req, res) => {
  const families = readData();
  const family = families.find(f => f.id === req.params.id);

  if (!family) {
    return res.status(404).json({ message: "Familia no encontrada" });
  }

  res.json(family);
});

/**
 * POST /api/invitations/:id/rsvp
 * Guardar confirmación
 */
router.post("/:id/rsvp", (req, res) => {
  const { response } = req.body;
  const families = readData();

  const family = families.find(f => f.id === req.params.id);
  if (!family) {
    return res.status(404).json({ message: "Familia no encontrada" });
  }

  family.rsvp = response;
  writeData(families);

  res.json({ message: "RSVP guardado correctamente" });
});

/**
 * GET /api/invitations/:id/qr
 * Generar QR
 */
router.get("/:id/qr", async (req, res) => {
  const url = `http://10.1.77.53:5500/index.html?familia=${req.params.id}`;
  const qr = await generateQR(url);
  res.json({ qr });
});

module.exports = router;