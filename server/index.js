const express = require("express");
const cors = require("cors");
const invitationRoutes = require("./routes/invitations");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/invitations", invitationRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});