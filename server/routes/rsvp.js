
const express = require("express");
const router = express.Router();
const { readData, writeData } = require("../utils/fileHandler");

/**
 * POST /api/invitations/:id/rsvp
 * Guardar confirmación
 */
router.post("/:id/rsvp", (req, res) => {
    
    // ✅ AQUÍ SE DEFINE EL PAYLOAD CORRECTAMENTE
    const payload = req.body;
    const families = readData();
    const family = families.find(f => f.id === req.params.id);

    if (!family) {
    return res.status(404).json({ message: "Invitación no encontrada" });
    }
    
    // ✅ Guardamos en la estructura correcta
    family.confirmation = {
        status: "confirmed",
        companions: payload.companions || []
    };

    writeData(families);
    res.json({ message: "RSVP guardado correctamente" });
  });

  module.exports = router