import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/users", async (req, res) => {
  const {
    id,
    names,
    district,
    business_activity,
    meter_serial_number,
    page,
    pageSize,
  } = req.query;

  const filters = {};

  if (id) {
    filters.id = {
      equals: parseInt(id), // Convertir el valor a un entero
    };
  }

  if (names) {
    filters.names = {
      contains: names,
      mode: "insensitive",
    };
  }

  if (district) {
    filters.district = {
      contains: district,
      mode: "insensitive",
    };
  }

  if (business_activity) {
    filters.business_activity = {
      contains: business_activity,
      mode: "insensitive",
    };
  }

  if (meter_serial_number) {
    filters.meter_serial_number = {
      contains: meter_serial_number,
      mode: "insensitive",
    };
  }

  const pageOptions = {};

  if (page && pageSize) {
    pageOptions.take = parseInt(pageSize); // Cantidad de registros por página
    pageOptions.skip = (parseInt(page) - 1) * parseInt(pageSize); // Cantidad de registros para omitir
  }

  const users = await prisma.users.findMany({
    where: filters,
    ...pageOptions,
  });

  res.json(users);
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  const user = await prisma.users.findUnique({
    where: { id: parseInt(id) },
  });

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  res.json(user);
});

router.get("/count-users", async (req, res) => {
  const count = await prisma.users.count();
  res.json({ count });
});

export default router;
