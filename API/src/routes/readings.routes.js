import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/users/:id/readings", async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  const filters = {
    nis_id: parseInt(id),
  };

  if (startDate && endDate) {
    filters.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const userReadings = await prisma.reading.findMany({
    where: filters,
    include: {
      users: true,
    },
  });

  res.json(userReadings);
});

export default router;
