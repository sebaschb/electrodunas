import { Router } from "express";
import { prisma } from "../db.js";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";

const router = Router();
const myCache = new NodeCache();

const cacheDirectory =
  "/app/src/routes/cache";

if (!fs.existsSync(cacheDirectory)) {
  fs.mkdirSync(cacheDirectory);
}

router.get("/users/:id/energy", async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, filter } = req.query;
    const cacheKey = `${id}-${start_date}-${end_date}-${filter}`;
    const cacheFilePath = path.join(cacheDirectory, `${cacheKey}.json`);

    if (fs.existsSync(cacheFilePath)) {
      const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, "utf8"));
      console.log("Usando datos en caché");
      return res.json(cachedData);
    }

    const filters = {
      nis_id: parseInt(id),
    };

    if (start_date && end_date) {
      filters.created_at = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    }

    let groupedData;

    if (filter === "day") {
      groupedData = await calculateEnergyByDay(filters);
    } else if (filter === "week") {
      groupedData = await calculateEnergyByWeek(filters);
    } else if (filter === "month") {
      groupedData = await calculateEnergyByMonth(filters);
    } else {
      return res.status(400).json({ error: "Invalid filter" });
    }

    // Almacenar los resultados en caché en el sistema de archivos local
    fs.writeFileSync(cacheFilePath, JSON.stringify(groupedData), "utf8");

    res.json(groupedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const calculateEnergyByDay = async (filters) => {
  try {
    const groupResult = await prisma.$queryRawUnsafe(
      `
      SELECT hour, 
             SUM(CAST(activeEnergySum AS NUMERIC)) AS activeEnergy,
             SUM(CAST(reactiveEnergySum AS NUMERIC)) AS reactiveEnergy,
             SUM(CAST(activeEnergySumSquare AS NUMERIC)) AS activeEnergyVariance,
             SUM(CAST(reactiveEnergySumSquare AS NUMERIC)) AS reactiveEnergyVariance,
  	       COUNT(*) AS count
      FROM (
          SELECT DATE(date) AS day,
                 EXTRACT(HOUR FROM date) AS hour, 
                 SUM(CAST(active_energy AS NUMERIC)) AS activeEnergySum,
                 SUM(CAST(reactive_energy AS NUMERIC)) AS reactiveEnergySum,
                 POWER((SUM(CAST(active_energy AS NUMERIC))),2) AS activeEnergySumSquare,
                 POWER((SUM(CAST(reactive_energy AS NUMERIC))),2) AS reactiveEnergySumSquare
          FROM energy
          WHERE (nis_id = $1)
          GROUP BY day, hour
        ) AS subquery
      GROUP BY hour;
    `,
      filters.nis_id
    );

    const groupedDataFinal = {};
    groupResult.forEach((entry) => {
      const hour = parseFloat(entry.hour);
      const numbDays = parseFloat(entry.count);
      const activeEnergy = parseFloat(entry.activeenergy);
      const reactiveEnergy = parseFloat(entry.reactiveenergy);
      const activeEnergyVariance = parseFloat(entry.activeenergyvariance);
      const reactiveEnergyVariance = parseFloat(entry.reactiveenergyvariance);

      if (!groupedDataFinal[hour]) {
        groupedDataFinal[hour] = {
          activeEnergy: 0,
          reactiveEnergy: 0,
          activeEnergyDeviation: 0,
          reactiveEnergyDeviation: 0,
        };
      }

      //Calculo de las medias de las energias
      const meanActive = activeEnergy / numbDays;
      const meanReactive = reactiveEnergy / numbDays;

      groupedDataFinal[hour].activeEnergy = meanActive;
      groupedDataFinal[hour].reactiveEnergy = meanReactive;

      //calculo de la media
      const meanVariaceActive =
        activeEnergyVariance / numbDays - Math.pow(meanActive, 2);
      const meanVariaceReactive =
        reactiveEnergyVariance / numbDays - Math.pow(meanReactive, 2);

      //calculo de la varianza
      groupedDataFinal[hour].activeEnergyDeviation =
        Math.sqrt(meanVariaceActive);
      groupedDataFinal[hour].reactiveEnergyDeviation =
        Math.sqrt(meanVariaceReactive);
    });

    console.log(groupedDataFinal);

    return groupedDataFinal;
  } catch (error) {
    throw error; // Lanzar el error para que sea capturado por el manejador de errores en la ruta principal
  }
};

const calculateEnergyByWeek = async (filters) => {
  try {
    const groupResult = await prisma.$queryRawUnsafe(
      `
      SELECT day_of_week, 
             SUM(CAST(activeEnergySum AS NUMERIC)) AS activeEnergy,
             SUM(CAST(reactiveEnergySum AS NUMERIC)) AS reactiveEnergy,
             SUM(CAST(activeEnergySumSquare AS NUMERIC)) AS activeEnergyVariance,
             SUM(CAST(reactiveEnergySumSquare AS NUMERIC)) AS reactiveEnergyVariance,
             COUNT(*) AS count
      FROM (
          SELECT DATE(date) AS day,
                 EXTRACT(ISODOW FROM date) AS day_of_week,
                 SUM(CAST(active_energy AS NUMERIC)) AS activeEnergySum,
                 SUM(CAST(reactive_energy AS NUMERIC)) AS reactiveEnergySum,
                 POWER(SUM(CAST(active_energy AS NUMERIC)), 2) AS activeEnergySumSquare,
                 POWER(SUM(CAST(reactive_energy AS NUMERIC)), 2) AS reactiveEnergySumSquare
          FROM energy
          WHERE nis_id = $1
          GROUP BY day_of_week, day
        ) AS subquery
      GROUP BY day_of_week;
    `,
      filters.nis_id
    );

    const groupedDataFinal = {};
    groupResult.forEach((entry) => {
      const dayOfWeek = parseFloat(entry.day_of_week);
      const dayOfWeekName = getDayOfWeekName(dayOfWeek);

      const numbDays = parseFloat(entry.count);
      const activeEnergy = parseFloat(entry.activeenergy);
      const reactiveEnergy = parseFloat(entry.reactiveenergy);
      const activeEnergyVariance = parseFloat(entry.activeenergyvariance);
      const reactiveEnergyVariance = parseFloat(entry.reactiveenergyvariance);

      if (!groupedDataFinal[dayOfWeekName]) {
        groupedDataFinal[dayOfWeekName] = {
          activeEnergy: 0,
          reactiveEnergy: 0,
          activeEnergyDeviation: 0,
          reactiveEnergyDeviation: 0,
        };
      }

      // Calculo de las medias de las energías
      const meanActive = activeEnergy / numbDays;
      const meanReactive = reactiveEnergy / numbDays;

      groupedDataFinal[dayOfWeekName].activeEnergy = meanActive;
      groupedDataFinal[dayOfWeekName].reactiveEnergy = meanReactive;

      // Calculo de la varianza
      const meanVarianceActive =
        activeEnergyVariance / numbDays - Math.pow(meanActive, 2);
      const meanVarianceReactive =
        reactiveEnergyVariance / numbDays - Math.pow(meanReactive, 2);

      groupedDataFinal[dayOfWeekName].activeEnergyDeviation =
        Math.sqrt(meanVarianceActive);
      groupedDataFinal[dayOfWeekName].reactiveEnergyDeviation =
        Math.sqrt(meanVarianceReactive);
    });

    console.log(groupedDataFinal);

    return groupedDataFinal;
  } catch (error) {
    throw error;
  }
};

const getDayOfWeekName = (dayOfWeek) => {
  const daysOfWeek = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  return daysOfWeek[dayOfWeek - 1];
};

const calculateEnergyByMonth = async (filters) => {
  try {
    const groupResult = await prisma.$queryRawUnsafe(
      `
      SELECT day_of_month, 
             SUM(CAST(activeEnergySum AS NUMERIC)) AS activeEnergy,
             SUM(CAST(reactiveEnergySum AS NUMERIC)) AS reactiveEnergy,
             SUM(CAST(activeEnergySumSquare AS NUMERIC)) AS activeEnergyVariance,
             SUM(CAST(reactiveEnergySumSquare AS NUMERIC)) AS reactiveEnergyVariance,
             COUNT(*) AS count
      FROM (
          SELECT DATE(date) AS day,
                 EXTRACT(DAY FROM date) AS day_of_month,
                 SUM(CAST(active_energy AS NUMERIC)) AS activeEnergySum,
                 SUM(CAST(reactive_energy AS NUMERIC)) AS reactiveEnergySum,
                 POWER(SUM(CAST(active_energy AS NUMERIC)), 2) AS activeEnergySumSquare,
                 POWER(SUM(CAST(reactive_energy AS NUMERIC)), 2) AS reactiveEnergySumSquare
          FROM energy
          WHERE nis_id = $1
          GROUP BY day_of_month, day
        ) AS subquery
      GROUP BY day_of_month;
    `,
      filters.nis_id
    );

    const groupedDataFinal = {};
    groupResult.forEach((entry) => {
      const dayOfMonth = parseFloat(entry.day_of_month);
      const numbDays = parseFloat(entry.count);
      const activeEnergy = parseFloat(entry.activeenergy);
      const reactiveEnergy = parseFloat(entry.reactiveenergy);
      const activeEnergyVariance = parseFloat(entry.activeenergyvariance);
      const reactiveEnergyVariance = parseFloat(entry.reactiveenergyvariance);

      if (!groupedDataFinal[dayOfMonth]) {
        groupedDataFinal[dayOfMonth] = {
          activeEnergy: 0,
          reactiveEnergy: 0,
          activeEnergyDeviation: 0,
          reactiveEnergyDeviation: 0,
        };
      }

      // Calculo de las medias de las energías
      const meanActive = activeEnergy / numbDays;
      const meanReactive = reactiveEnergy / numbDays;

      groupedDataFinal[dayOfMonth].activeEnergy = meanActive;
      groupedDataFinal[dayOfMonth].reactiveEnergy = meanReactive;

      // Cálculo de la varianza
      const meanVarianceActive =
        activeEnergyVariance / numbDays - Math.pow(meanActive, 2);
      const meanVarianceReactive =
        reactiveEnergyVariance / numbDays - Math.pow(meanReactive, 2);

      groupedDataFinal[dayOfMonth].activeEnergyDeviation =
        Math.sqrt(meanVarianceActive);
      groupedDataFinal[dayOfMonth].reactiveEnergyDeviation =
        Math.sqrt(meanVarianceReactive);
    });

    console.log(groupedDataFinal);

    return groupedDataFinal;
  } catch (error) {
    throw error; // Lanzar el error para que sea capturado por el manejador de errores en la ruta principal
  }
};

router.get("/users/:id/energy/historical", async (req, res) => {
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

  const userEnergy = await prisma.energy.findMany({
    where: filters,
    include: {
      users: false,
    },
  });

  const groupedDataByDay = {};

  userEnergy.forEach((entry) => {
    const date = entry.date;
    const day = date.toISOString().slice(0, 10);
    const activeEnergy = parseFloat(entry.active_energy);
    const reactiveEnergy = parseFloat(entry.reactive_energy);

    //Se agrupa por dia
    if (!groupedDataByDay[day]) {
      // Inicializar el objeto para el día si no existe
      groupedDataByDay[day] = {
        activeEnergySum: activeEnergy,
        reactiveEnergySum: reactiveEnergy,
      };
    } else {
      groupedDataByDay[day].activeEnergySum += activeEnergy;
      groupedDataByDay[day].reactiveEnergySum += reactiveEnergy;
    }
  });

  const sortedDataByDay = {};

  Object.keys(groupedDataByDay)
    .sort()
    .forEach((key) => {
      sortedDataByDay[key] = groupedDataByDay[key];
    });

  res.json(sortedDataByDay);
});

export default router;
