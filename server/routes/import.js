const express = require("express");
const router = express.Router();
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const { readData, writeData } = require("../utils/fileHandler");
const { generateNextId } = require("../utils/idGenerator");

const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/admin/import/csv
 */
router.post("/import/csv", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Archivo CSV requerido" });
    }

    const csvText = req.file.buffer.toString("utf-8");

    let records;
    try {
        
        records = parse(csvText, {
            columns: headers =>
              headers.map(h =>
                String(h).trim().replace(/^\uFEFF/, "")
              ),
            skip_empty_lines: true
          });
          
  
    } catch (err) {
        return res.status(400).json({ message: "CSV inválido" });
    }

    const families = readData();
    const isInitialLoad = families.length === 0;
    const familyMap = new Map(families.map(f => [f.id, f]));

    const newFamilies = [];
    const updatedFamilies = [];
    const validationErrors = [];
    const seenDisplayNames = new Set();
    
    // Validación previa: revisar cada fila antes de cargar informacion
    if (isInitialLoad) {
        for (const [index, row] of records.entries()) {
      
          if (!row.id || !row.id.trim()) {
            validationErrors.push({
              row: index + 1,
              displayName: row.displayName,
              reason: "La carga inicial requiere que todas las filas tengan ID"
            });
          }
      
          if (!row.type || !row.displayName || !row.maxGuests) {
            validationErrors.push({
              row: index + 1,
              reason: "Columnas obligatorias incompletas"
            });
          }
        }
      }

      if (validationErrors.length) {
        return res.status(400).json({
          message: "Errores en la carga inicial. No se realizó ninguna importación.",
          errors: validationErrors
        });
      }
      
    for (const row of records) {
        if (!row.type || !row.displayName || !row.maxGuests) continue;

        const displayName = row.displayName?.trim();
        if (!displayName) {
            skippedRows.push({
                row: index + 1,
                reason: "displayName vacío"
            });
            continue;
        }

        const normalizedName = displayName.toLowerCase();
        // ✅ AQUÍ va la validación de duplicados
        if (seenDisplayNames.has(normalizedName)) {
            skippedRows.push({
                row: index + 1,
                displayName,
                reason: "displayName duplicado dentro del CSV"
            });
            continue;
        }

        seenDisplayNames.add(normalizedName);

        const rawGuests = row.guests ? String(row.guests) : "";
        const guests = rawGuests
                        .split(";")
                        .map(n => n.trim())
                        .filter(Boolean)
                        .map(name => ({ name }));
    
        let id = row.id?.trim();
    
        // ✅ Caso 1: NO trae ID → generar uno nuevo
        if (!id) {
            id = generateNextId([...families, ...newFamilies]);
            families.push({
                id,
                type: row.type.trim(),
                displayName: row.displayName.trim(),
                guests,
                maxGuests: Number(row.maxGuests)
            });
            newFamilies.push(id);
            continue;
        }
    
        // ✅ Caso 2: Trae ID y YA existe → actualizar
        if (familyMap.has(id)) {
            const existing = familyMap.get(id);
        
            Object.assign(existing, {
                type: row.type.trim(),
                displayName: row.displayName.trim(),
                guests,
                maxGuests: Number(row.maxGuests)
                // ❗ NO tocamos existing.confirmation
            });
        
            updatedFamilies.push(id);
        } 
        // ✅ Caso 3: Trae ID pero NO existe → insertar
        else {
            families.push({
                id,
                type: row.type.trim(),
                displayName: row.displayName.trim(),
                guests,
                maxGuests: Number(row.maxGuests)
            });
            newFamilies.push(id);
        }
    }
    
    writeData([...families]);
    
    res.json({
        message: "Importación completada",
        nuevos: newFamilies.length,
        actualizados: updatedFamilies.length
    });
});

module.exports = router;
