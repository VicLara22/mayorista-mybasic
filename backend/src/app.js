const express = require("express");
const cors = require("cors");
const path = require("path");

const stockRoutes = require("./routes/stock.routes");
const productosRoutes = require("./routes/productos.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const authRoutes = require("./auth/auth.routes");

const app = express();

const origenesPermitidos = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://mybasic.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origenesPermitidos.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS"));
    },
  }),
);

app.use(express.json({ limit: "100kb" }));

app.use(
  "/imagenes",
  express.static(path.join(__dirname, "../../frontend/imagenes")),
);

app.get("/", (req, res) => {
  res.json({
    mensaje: "API MyBasic funcionando",
  });
});

app.use("/api/stock", stockRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/productos", productosRoutes);

module.exports = app;
