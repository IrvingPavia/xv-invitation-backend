const express = require("express");
const cors = require("cors");
const invitationRoutes = require("./routes/invitations");
const importRoutes = require("./routes/import");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/invitations", invitationRoutes);
app.use("/api/admin", importRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});