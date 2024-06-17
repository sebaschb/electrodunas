import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/users/:id/instrumentations", async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date } = req.query;

  const filters = {
    nis_id: parseInt(id),
  };

  if (start_date && end_date) {
    filters.date = {
      gte: new Date(start_date),
      lte: new Date(end_date),
    };
  }

  const userInstrumentations = await prisma.instrumentation.findMany({
    where: filters,
    include: {
      users: false,
    },
  });

  const groupedDataByDay = {};

  userInstrumentations.forEach((entry) => {
    const date = entry.date;
    const day = date.toISOString().slice(0, 10);
    const fa_voltage = parseFloat(entry.fa_voltage);
    const fb_voltage = parseFloat(entry.fb_voltage);
    const fc_voltage = parseFloat(entry.fc_voltage);
    const fa_current = parseFloat(entry.fa_current);
    const fb_current = parseFloat(entry.fb_current);
    const fc_current = parseFloat(entry.fc_current);

    // Se agrupa por día
    if (!groupedDataByDay[day]) {
      // Inicializar el objeto para el día si no existe
      groupedDataByDay[day] = {
        fa_voltage: fa_voltage,
        fb_voltage: fb_voltage,
        fc_voltage: fc_voltage,
        // fa_current: fa_current,
        // fb_current: fb_current,
        // fc_current: fc_current,
      };
    } else {
      groupedDataByDay[day].fa_voltage += fa_voltage;
      groupedDataByDay[day].fb_voltage += fb_voltage;
      groupedDataByDay[day].fc_voltage += fc_voltage;
      // groupedDataByDay[day].fa_current += fa_current;
      // groupedDataByDay[day].fb_current += fb_current;
      // groupedDataByDay[day].fc_current += fc_current;
    }
  });

  res.json(groupedDataByDay);
});

export default router;
