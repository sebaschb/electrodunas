import express from "express";
import userRoutes from "./routes/users.routes.js";
import readingsRoutes from "./routes/readings.routes.js";
import instrumentsRoutes from "./routes/instrumentations.routes.js";
import routerRoutes from "./routes/energy.routes.js";
import alarmRoutes from "./routes/alarms.routes.js";
import cors from "cors";

const app = express();

app.use(express.json());

// Habilitar CORS
app.use(cors());

app.use("/api", userRoutes);
app.use("/api", readingsRoutes);
app.use("/api", instrumentsRoutes);
app.use("/api", routerRoutes);
app.use("/api", alarmRoutes);

app.listen(5000);

console.log("Server on port", 5000);
