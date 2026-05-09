const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const { readData } = require("../utils/fileHandler");
const archiver = require("archiver");
const { generateQR } = require("../utils/qr");
const PDFDocument = require("pdfkit");
const fs = require("fs");



const DOMAIN_URL = "http://127.0.0.1:5500";
const BASE_INVITE_URL = "http://127.0.0.1:5500/public/index.html";

router.get("/rsvps", (req, res) => {
  const families = readData();

  let totalInvitations = families.length;
  let confirmedInvitations = 0;
  let totalGuestsConfirmed = 0;

  const items = families.map(family => {
    const confirmed = Boolean(family.confirmation);

    let totalGuests = 0;

    if (confirmed) {
      confirmedInvitations++;

      if (family.type === "family") {
        totalGuests = family.guests.length;
      } else {
        totalGuests =
          1 + (family.confirmation.companions?.length || 0);
      }

      totalGuestsConfirmed += totalGuests;
    }

    return {
      id: family.id,
      displayName: family.displayName,
      type: family.type,
      maxGuests: family.maxGuests,
      confirmed,
      totalGuests
    };
  });

  res.json({
    totalInvitations,
    confirmedInvitations,
    pendingInvitations:
      totalInvitations - confirmedInvitations,
    totalGuestsConfirmed,
    items
  });
});

router.get("/export/rsvps.csv", (req, res) => {
    const families = readData();

    let rows = [];
    rows.push("invitationId,displayName,personName,type");

    families.forEach(fam => {
    if (!fam.confirmation) return;

    if (fam.type === "family") {
        fam.guests.forEach(g => {
        rows.push(
            `${fam.id},"${fam.displayName}","${g.name}",${fam.type}`
        );
        });
    } else {
        // invitado principal
        rows.push(
        `${fam.id},"${fam.displayName}","${fam.displayName}",${fam.type}`
        );

        // acompañantes
        (fam.confirmation.companions || []).forEach(c => {
        rows.push(
            `${fam.id},"${fam.displayName}","${c.name}",${fam.type}`
        );
        });
    }
    });

    const csvContent = rows.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
    "Content-Disposition",
    'attachment; filename="rsvps_confirmados.csv"'
    );

    res.send(csvContent);
});

router.get("/export/rsvps.xlsx", (req, res) => {
    const families = readData();
    let confirmedInvitations = 0;
    let totalGuestsConfirmed = 0;
  
    // =========================
    // HOJA 1: RSVPs Confirmados
    // =========================
    const rsvpRows = [
        [
          "Invitación ID",
          "Tipo",
          "Display Name",
          "Total Invitados",
          "Invitados",
          "Link Invitación"
        ]
      ];
      
      families.forEach(fam => {
        // if (!fam.confirmation) return;
      
        let invitados = [];
        let totalInvitados = 0;
      
        if (fam.type === "family") {
          invitados = fam.guests.map(g => g.name);
          totalInvitados = invitados.length;
        } else {
          invitados.push(fam.displayName);
      
          if(fam.confirmation && fam.confirmation.companions) {
            (fam.confirmation.companions || []).forEach(c => {
                invitados.push(c.name);
            });
          }
      
          totalInvitados = invitados.length;
        }
      
        const inviteLink = `${BASE_INVITE_URL}?inv=${fam.id}`;
      
        rsvpRows.push([
          fam.id,
          fam.type,
          fam.displayName,
          totalInvitados,
          invitados.join(", "),
          inviteLink
        ]);
      });
  
    
    // =========================
    // HOJA 2: Resumen
    // =========================
    const summaryRows = [
      ["Métrica", "Valor"],
      ["Total de invitaciones", families.length],
      ["Invitaciones confirmadas", confirmedInvitations],
      ["Invitaciones pendientes", families.length - confirmedInvitations],
      ["Total asistentes confirmados", totalGuestsConfirmed],
      ["Fecha de exportación", new Date().toLocaleString()]
    ];
  
    // =========================
    // Crear Excel
    // =========================
    const workbook = XLSX.utils.book_new();
  
    const rsvpSheet = XLSX.utils.aoa_to_sheet(rsvpRows);
    XLSX.utils.book_append_sheet(
      workbook,
      rsvpSheet,
      "RSVPs Confirmados"
    );
  
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Resumen"
    );
  
    // =========================
    // Enviar archivo
    // =========================
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });
  
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="rsvps_confirmados.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const range = XLSX.utils.decode_range(rsvpSheet["!ref"]);
    for (let row = 1; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 5 }); // columna Link
        if (rsvpSheet[cellRef]) {
            rsvpSheet[cellRef].l = {
            Target: rsvpSheet[cellRef].v,
            Tooltip: "Abrir invitación"
            };
        }
    }

    res.send(buffer);
});

router.get("/export/qrs.zip", async (req, res) => {
    const families = readData();
  
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="qrs_invitaciones.zip"'
    );
    res.setHeader("Content-Type", "application/zip");
  
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });
  
    archive.pipe(res);
  
    for (const fam of families) {
      const inviteLink = `${BASE_INVITE_URL}?inv=${fam.id}`;
      const qrPath = await generateQR(fam.id, inviteLink);
  
      archive.file(qrPath, { name: `${fam.id}.png` });
    }
  
    await archive.finalize();
  });
  
router.get("/export/cards.pdf", async (req, res) => {
    const families = readData();

    res.setHeader(
        "Content-Disposition",
        'attachment; filename="tarjetas_invitacion.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({ size: "A4", margin: 20 });
    
    doc.registerFont(
        "title",
        "server/assets/fonts/Cormorant_Garamond/static/CormorantGaramond-SemiBold.ttf"
    );
    doc.registerFont(
        "body",
        "server/assets/fonts/Lato/Lato-Regular.ttf"
    );
  
    doc.pipe(res);

    const cols = 2;
    const rows = 4;

    const pageW = doc.page.width - 40;
    const pageH = doc.page.height - 40;

    const cardW = pageW / cols;
    const cardH = pageH / rows;

    let index = 0;

    for (const fam of families) {
        // Generar QR si no existe
        const url = `${BASE_INVITE_URL}?inv=${fam.id}`;
        await generateQR(fam.id, url);

        const col = index % cols;
        const row = Math.floor(index / cols) % rows;

        const x = 20 + col * cardW;
        const y = 20 + row * cardH;

        if (index > 0 && index % 8 === 0) {
        doc.addPage();
        }

        renderCard(doc, fam, x, y, cardW, cardH);
        index++;
    }

    doc.end();
});
  
  

module.exports = router;


// Función para renderizar el contenido de cada tarjeta
function renderCard(doc, fam, x, y, w, h) {
    const padding = 14;
    const innerX = x + padding;
    const innerY = y + padding;
    const innerW = w - padding * 2;
    const innerH = h - padding * 2;
  
    const qrSize = 78;
    const qrX = innerX;
    const qrY = innerY + innerH / 2 - qrSize / 2;
  
    const textX = innerX + qrSize + 16;
    const textW = innerW - qrSize - 16;
  
    const totalInvitados =
      fam.type === "family"
        ? fam.guests.length
        : 1 + (fam.confirmation?.companions?.length || 0);
  
    // Fondo
    doc.image("server/assets/card/card_004.png", x, y, {
      width: w,
      height: h
    });
  
    // Overlay solo para el bloque de texto
    const textOverlayX = textX - 10;
    const textOverlayY = innerY + 8;
    const textOverlayW = textW + 20;
    const textOverlayH = 82;

    doc
    .fillOpacity(0.75)
    .fill("#FAF7F2")
    .roundedRect(
        textOverlayX,
        textOverlayY,
        textOverlayW,
        textOverlayH,
        8
    )
    .fill()
    .fillOpacity(1);

    // // Overlay suave (menos opaco)
    // doc
    //   .fillOpacity(0.78)
    //   .fill("#FAF7F2")
    //   .roundedRect(
    //     innerX + 6,
    //     innerY + 6,
    //     innerW - 12,
    //     innerH - 12,
    //     10
    //   )
    //   .fill()
    //   .fillOpacity(1);
  
    // Línea punteada de corte
    doc
      .dash(3, { space: 3 })
      .rect(x, y, w, h)
      .stroke("#8D8A84")
      .undash();
  
    // QR
    doc
        .fillColor("#FAF7F2")
        .roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 6)
        .fill();
  
    doc.image(`server/qrs/${fam.id}.png`, qrX, qrY, {
        width: qrSize,
        height: qrSize
    });
  
  
    // Título
    // doc
    //   .font("title")
    //   .fontSize(12)
    //   .fillColor("#2F3E2F")
    //   .text("Valeria", textX, innerY + 12, {
    //     width: textW,
    //     characterSpacing: 0.6,
    //     lineGap: 2
    //   });
    // Sombra sutil para texto (truco editorial)
    doc
        .fillColor("#ffffff")
        .font("title")
        .fontSize(12)
        .text("Valeria", textX + 0.5, innerY + 12 + 0.5);

    doc
        .fillColor("#2F3E2F")
        .font("title")
        .fontSize(12)
        .text("Valeria", textX, innerY + 12);
  
    // Subtítulo
    doc
      .font("body")
      .fontSize(9)
      .fillColor("#6B7D5C")
      .text("Mis XV Años", textX, innerY + 30, {
        width: textW,
        characterSpacing: 0.4
      });
  
    // Display Name
    doc
      .font("body")
      .fontSize(9)
      .fillColor("#333333")
      .text(fam.displayName, textX, innerY + 52, {
        width: textW,
        characterSpacing: 0.2,
        lineGap: 3
      });
  
    // Cupo
    doc
      .fontSize(8)
      .fillColor("#555555")
      .text(
        `Invitación válida para ${totalInvitados} personas`,
        textX,
        innerY + 72,
        {
          width: textW,
          characterSpacing: 0.2
        }
      );
  }
  