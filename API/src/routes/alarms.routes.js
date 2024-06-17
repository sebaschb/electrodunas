import { Router } from "express";
import { prisma } from "../db.js";
import { quantile } from "simple-statistics";
import { parse, subDays, addDays, differenceInDays, format } from "date-fns";

const router = Router();
// Función para agrupar los datos de energía por día y hora
const groupEnergyData = (userEnergy) => {
  const groupedData = {};

  userEnergy.forEach((entry) => {
    const date = entry.date;
    const day = date.toISOString().slice(0, 10);
    const hour = date.getUTCHours();
    const activeEnergy = parseFloat(entry.active_energy);
    const reactiveEnergy = parseFloat(entry.reactive_energy);

    if (!groupedData[day]) {
      groupedData[day] = {};
    }

    if (!groupedData[day][hour]) {
      groupedData[day][hour] = {
        activeEnergySum: 0,
        reactiveEnergySum: 0,
      };
    }
    groupedData[day][hour].activeEnergySum += activeEnergy;
    groupedData[day][hour].reactiveEnergySum += reactiveEnergy;
  });

  return groupedData;
};

const processEnergyData = async (id) => {
  const filters = {
    nis_id: parseInt(id),
  };

  const userEnergy = await prisma.energy.findMany({
    where: filters,
    include: {
      users: false,
    },
  });

  const groupedData = groupEnergyData(userEnergy);

  const groupResult = {};

  for (const day in groupedData) {
    for (const hour in groupedData[day]) {
      if (!groupResult[hour]) {
        groupResult[hour] = [];
      }

      groupResult[hour].push({
        activeEnergy: groupedData[day][hour].activeEnergySum,
        reactiveEnergy: groupedData[day][hour].reactiveEnergySum,
        date: day,
      });
    }
  }

  return groupResult;
};

const calculatePercentiles = async (energyArray) => {
  return {
    p1: quantile(energyArray, 0.01),
    p99: quantile(energyArray, 0.99),
    p0_5: quantile(energyArray, 0.005),
    p99_5: quantile(energyArray, 0.995),
    p0_1: quantile(energyArray, 0.001),
    p99_9: quantile(energyArray, 0.999),
  };
};

function parseDate(dateString) {
  const [day, month, year] = dateString.split("/");
  return new Date(`${year}-${month}-${day}`);
}

router.get("/users/:id/percentil", async (req, res) => {
  try {
    const { id } = req.params;
    const groupResult = await processEnergyData(id);

    const percentiles = {};

    for (const hour in groupResult) {
      const energyArray = groupResult[hour].map((entry) => entry.activeEnergy);

      percentiles[hour] = await calculatePercentiles(energyArray);

      // Guardar los percentiles en la tabla "percentile"
      await prisma.percentile.create({
        data: {
          nis_id: parseInt(id),
          ...percentiles[hour],
          hour: parseInt(hour),
        },
      });
    }

    res.json(percentiles);
  } catch (error) {
    console.error("Error al obtener los percentiles:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener los percentiles." });
  }
});

router.get("/users/:id/alarms", async (req, res) => {
  try {
    const { id } = req.params;
    const groupResult = await processEnergyData(id);

    for (const hour in groupResult) {
      for (const entry of groupResult[hour]) {
        const activeEnergyDate = entry.date;
        const activeEnergyValue = entry.activeEnergy;
        const percentiles = await prisma.percentile.findFirst({
          where: { nis_id: parseInt(id), hour: parseInt(hour) },
        });
        const p0_1 = percentiles.p0_1;
        const p0_5 = percentiles.p0_5;
        const p1 = percentiles.p1;
        const p99 = percentiles.p99;
        const p99_5 = percentiles.p99_5;
        const p99_9 = percentiles.p99_9;

        let alertType = "";
        const allPercentilesEqual =
            p99_9 === p0_1 &&
            p99_9 === p99_5 &&
            p99_9 === p99 &&
            p99_9 === p0_5 &&
            p99_9 === p1;

            if (allPercentilesEqual) {
              alertType = "normal";
            } else if (activeEnergyValue >= p99_9 || activeEnergyValue <= p0_1) {
              alertType = "high";
            } else if (activeEnergyValue >= p99_5 || activeEnergyValue <= p0_5) {
              alertType = "medium";
            } else if (activeEnergyValue >= p99 || activeEnergyValue <= p1) {
              alertType = "low";
            } else {
              alertType = "normal";
            }

        if (alertType != "normal") {
          const parsedDate = parse(activeEnergyDate, "yyyy-MM-dd", new Date());
          parsedDate.setUTCHours(parseInt(hour));

          await prisma.alerts.create({
            data: {
              nis_id: parseInt(id),
              date: parsedDate,
              hour: parseInt(hour),
              alert_type: alertType,
              value: activeEnergyValue,
            },
          });
        }
      }
    }

    res.json({ message: "Alertas creadas correctamente." });
  } catch (error) {
    console.error("Error al generar las alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al generar las alertas." });
  }
});

router.get("/generate-percentiles", async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    const allPercentiles = {};

    for (const user of users) {
      const userId = parseInt(user.id);
      const groupResult = await processEnergyData(userId);
      const userPercentiles = {};

      for (const hour in groupResult) {
        const energyArray = groupResult[hour].map(
          (entry) => entry.activeEnergy
        );
        userPercentiles[hour] = await calculatePercentiles(energyArray);
        await prisma.percentile.create({
          data: {
            nis_id: userId,
            ...userPercentiles[hour],
            hour: parseInt(hour),
          },
        });
      }

      allPercentiles[userId] = userPercentiles;
    }

    res.json(users);
  } catch (error) {
    console.error("Error al calcular los percentiles:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al calcular los percentiles." });
  }
});

router.get("/generate-alarms", async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    for (const user of users) {
      const userId = parseInt(user.id);
      const groupResult = await processEnergyData(userId);

      for (const hour in groupResult) {
        for (const entry of groupResult[hour]) {
          const activeEnergyDate = entry.date;
          const activeEnergyValue = entry.activeEnergy;
          const percentiles = await prisma.percentile.findFirst({
            where: { nis_id: parseInt(userId), hour: parseInt(hour) },
          });
          const p0_1 = percentiles.p0_1;
          const p0_5 = percentiles.p0_5;
          const p1 = percentiles.p1;
          const p99 = percentiles.p99;
          const p99_5 = percentiles.p99_5;
          const p99_9 = percentiles.p99_9;

          let alertType = "";
          const allPercentilesEqual =
            p99_9 === p0_1 &&
            p99_9 === p99_5 &&
            p99_9 === p99 &&
            p99_9 === p0_5 &&
            p99_9 === p1;

          if (allPercentilesEqual) {
            alertType = "normal";
          } else if (activeEnergyValue >= p99_9 || activeEnergyValue <= p0_1) {
            alertType = "high";
          } else if (activeEnergyValue >= p99_5 || activeEnergyValue <= p0_5) {
            alertType = "medium";
          } else if (activeEnergyValue >= p99 || activeEnergyValue <= p1) {
            alertType = "low";
          } else {
            alertType = "normal";
          }

          if (alertType != "normal") {
            const parsedDate = parse(
              activeEnergyDate,
              "yyyy-MM-dd",
              new Date()
            );
            parsedDate.setUTCHours(parseInt(hour));

            await prisma.alerts.create({
              data: {
                nis_id: userId,
                date: parsedDate,
                hour: parseInt(hour),
                alert_type: alertType,
                value: activeEnergyValue,
              },
            });
          }
        }
      }
    }

    res.json({
      message: "Alertas creadas correctamente para todos los usuarios.",
    });
  } catch (error) {
    console.error("Error al generar las alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al generar las alertas." });
  }
});

router.get("/alerts-summary", async (req, res) => {
  try {
    const alertsSummary = [];

    // Obtener el valor del parámetro de la fecha final
    const endDateString = req.query.endDate;
    if (!endDateString) {
      return res
        .status(400)
        .json({ error: "El parámetro 'endDate' es necesario." });
    }

    // Obtener el valor del parámetro de número de días (opcional, valor predeterminado de 30 días)
    const numDays = parseInt(req.query.numDays) || 30;

    // Convertir la fecha final a un objeto Date
    const endDate = parseDate(endDateString);

    // Calcular la fecha de inicio basada en la fecha final y el número de días
    const startDate = subDays(endDate, numDays);

    // Construir el filtro para la consulta de Prisma basado en la fecha de inicio y fin (para todos los usuarios)
    const alertsFilter = {
      date: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    };

    // Obtener todos los nis_id que deberían tener datos en el rango de fechas
    const allNisIds = await prisma.alerts.findMany({
      where: alertsFilter,
      select: {
        nis_id: true,
        users: {
          select: {
            names: true,
          },
        },
      },
      distinct: ["nis_id"],
    });

    // Inicializar el resumen de alertas para cada usuario
    allNisIds.forEach((item) => {
      const userId = item.nis_id;
      const userName = item.users?.names;
      alertsSummary.push({
        nis_id: userId,
        high: 0,
        medium: 0,
        low: 0,
        name: userName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    });

    // Obtener los resultados de las alertas para el período deseado para cada usuario
    const userAlertsSummary = await prisma.alerts.groupBy({
      by: ["nis_id", "alert_type"],
      _count: true,
      where: alertsFilter,
    });

    // Actualizar el resumen de alertas para cada usuario con los datos obtenidos
    userAlertsSummary.forEach((alert) => {
      const userId = alert.nis_id;
      const alertType = alert.alert_type;
      const alertCount = alert._count;

      const userSummary = alertsSummary.find(
        (summary) => summary.nis_id === userId
      );
      if (userSummary) {
        userSummary[alertType] = alertCount;
      }
    });

    const orderBy = req.query.orderBy || "high";
    if (orderBy && ["high", "medium", "low"].includes(orderBy)) {
      alertsSummary.sort((a, b) => b[orderBy] - a[orderBy]);
    }

    // Si no se envían los datos de paginación, devolver todos los datos
    if (!req.query.page && !req.query.pageSize) {
      return res.json(alertsSummary);
    }

    // Extraer los resultados paginados según los parámetros de la consulta
    const page = parseInt(req.query.page) || 1; // Página predeterminada: 1
    const pageSize = parseInt(req.query.pageSize) || 15; // Tamaño de página predeterminado: 10
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedData = alertsSummary.slice(startIndex, endIndex);

    res.json(paginatedData);
  } catch (error) {
    console.error("Error al obtener el resumen de alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener el resumen de alertas." });
  }
});

router.get("/users/:id/alerts-summary-by-day", async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el valor del parámetro de número de días (por defecto es 30 si no se proporciona)
    const numDays = parseInt(req.query.numDays) || 30;

    const endDateString = req.query.endDate;

    if (!endDateString) {
      return res
        .status(400)
        .json({ error: "El parámetro 'endDate' es necesario." });
    }

    // Convertir la fecha final a un objeto Date
    const endDate = parseDate(endDateString);

    const startDate = subDays(endDate, numDays);

    const alertsFilter = {
      nis_id: parseInt(id),
      date: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    };

    // Obtener los resultados de las alertas para los últimos días para el usuario
    const userAlertsSummary = await prisma.alerts.groupBy({
      by: ["date", "alert_type"],
      _count: true,
      where: alertsFilter,
    });

    const alertsSummaryByDay = {};

    let currentDate = startDate;
    const daysDifference = differenceInDays(endDate, startDate);
    for (let i = 0; i <= daysDifference; i++) {
      const formattedDate = currentDate.toISOString().slice(0, 10);
      alertsSummaryByDay[formattedDate] = { high: 0, medium: 0, low: 0 };
      currentDate = addDays(currentDate, 1);
    }

    userAlertsSummary.forEach((alert) => {
      const date = alert.date.toISOString().slice(0, 10);
      const alertType = alert.alert_type;
      const alertCount = alert._count;

      alertsSummaryByDay[date][alertType] += alertCount;
    });

    const unsortedDates = Object.keys(alertsSummaryByDay);

    const sortedDates = unsortedDates.sort((a, b) => a.localeCompare(b));

    const sortedAlertsSummaryByDay = {};
    sortedDates.forEach((date) => {
      sortedAlertsSummaryByDay[date] = alertsSummaryByDay[date];
    });

    const alertsSummaryByDayFormatted = {};
    for (const date in sortedAlertsSummaryByDay) {
      const formattedDate = date.split("-").reverse().join("/");
      alertsSummaryByDayFormatted[formattedDate] =
        sortedAlertsSummaryByDay[date];
    }

    res.json(alertsSummaryByDayFormatted);
  } catch (error) {
    console.error("Error al obtener el resumen de alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener el resumen de alertas." });
  }
});

router.get("/latest-alerts", async (req, res) => {
  try {
    // Obtener la última alerta para cada usuario
    const latestAlerts = await prisma.alerts.groupBy({
      by: ["nis_id"],
      _max: {
        date: true,
      },
    });

    // Crear un objeto para almacenar las últimas alertas por ID de usuario
    const latestAlertsByUser = {};

    // Procesar los resultados para obtener las últimas alertas de cada usuario
    for (const alert of latestAlerts) {
      const userId = alert.nis_id;
      const latestDate = alert._max.date;

      // Utilizar la fecha más reciente para obtener la última alerta para el usuario actual
      const latestAlert = await prisma.alerts.findFirst({
        where: {
          nis_id: userId,
          date: latestDate,
        },
        orderBy: {
          date: "desc", // Ordenar por fecha en orden descendente para obtener la última alerta
        },
      });

      // Agregar la última alerta al objeto de resultados
      if (latestAlert) {
        latestAlertsByUser[userId] = latestAlert;
      }
    }

    res.json(latestAlertsByUser);
  } catch (error) {
    console.error("Error al obtener las últimas alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener las últimas alertas." });
  }
});

router.get("/latest-alert/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId); // Convertir el parámetro userId a un entero

    // Verificar si el usuario existe
    const userExists = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Obtener la última alerta para el usuario especificado
    const latestAlert = await prisma.alerts.findFirst({
      where: {
        nis_id: userId,
      },
      orderBy: {
        date: "desc", // Ordenar por fecha en orden descendente para obtener la última alerta
      },
    });

    // Si no se encuentra ninguna alerta, devolver el valor "normal" para alertType
    const alertType = latestAlert ? latestAlert.alert_type : "normal";

    res.json({ alertType });
  } catch (error) {
    console.error("Error al obtener la última alerta:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener la última alerta." });
  }
});

router.get("/latest-alerts-summary", async (req, res) => {
  try {
    // Obtener la última alerta para cada usuario
    const latestAlerts = await prisma.alerts.groupBy({
      by: ["nis_id"],
      _max: {
        date: true,
      },
    });

    // Crear un objeto para almacenar las últimas alertas por ID de usuario
    const latestAlertsByUser = {};

    // Procesar los resultados para obtener las últimas alertas de cada usuario
    for (const alert of latestAlerts) {
      const userId = alert.nis_id;
      const latestDate = alert._max.date;

      // Utilizar la fecha más reciente para obtener la última alerta para el usuario actual
      const latestAlert = await prisma.alerts.findFirst({
        where: {
          nis_id: userId,
          date: latestDate,
        },
        orderBy: {
          date: "desc", // Ordenar por fecha en orden descendente para obtener la última alerta
        },
      });

      // Agregar la última alerta al objeto de resultados
      if (latestAlert) {
        latestAlertsByUser[userId] = latestAlert;
      }
    }

    // Crear un objeto para almacenar las cantidades de alertas por tipo
    const alertsCountByType = {
      low: 0,
      medium: 0,
      high: 0,
    };

    // Recorrer las últimas alertas de cada usuario y sumar la cantidad de alertas por tipo
    Object.values(latestAlertsByUser).forEach((alert) => {
      const alertType = alert.alert_type;

      // Incrementar el contador correspondiente al tipo de alerta
      if (alertType === "low") {
        alertsCountByType.low++;
      } else if (alertType === "medium") {
        alertsCountByType.medium++;
      } else if (alertType === "high") {
        alertsCountByType.high++;
      }
    });

    res.json(alertsCountByType);
  } catch (error) {
    console.error("Error al obtener el resumen de alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener el resumen de alertas." });
  }
});

router.get("/latest-alerts2", async (req, res) => {
  try {
    // Obtener todos los usuarios
    const users = await prisma.users.findMany();

    // Crear un objeto para almacenar las últimas alertas por ID de usuario
    const latestAlertsByUser = {};

    // Obtener la última alerta para cada usuario
    for (const user of users) {
      const userId = user.id;

      // Obtener la última alerta para el usuario actual
      const latestAlert = await prisma.alerts.findFirst({
        where: {
          nis_id: userId,
        },
        orderBy: {
          date: "desc", // Ordenar por fecha en orden descendente para obtener la última alerta
        },
      });

      // Agregar la última alerta al objeto de resultados
      if (latestAlert) {
        latestAlertsByUser[userId] = latestAlert.alert_type;
      } else {
        // Si no se encuentra ninguna alerta, establecer el valor "normal" para alertType
        latestAlertsByUser[userId] = "normal";
      }
    }

    res.json(latestAlertsByUser);
  } catch (error) {
    console.error("Error al obtener las últimas alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener las últimas alertas." });
  }
});

router.get("/alerts-summary-latest-color", async (req, res) => {
  try {
    const alertsSummary = [];

    // Obtener el valor del parámetro de número de días (opcional, valor predeterminado de 30 días)
    const numDays = parseInt(req.query.numDays) || 7;

    // Obtener la última fecha registrada en la tabla de alertas
    const latestAlertDateEntry = await prisma.alerts.findFirst({
      orderBy: {
        date: "desc",
      },
    });

    if (!latestAlertDateEntry) {
      return res
        .status(400)
        .json({ error: "No hay alertas registradas en la base de datos." });
    }

    const endDate = new Date(latestAlertDateEntry.date);

    // Calcular la fecha de inicio basada en la fecha final y el número de días
    const startDate = subDays(endDate, numDays);

    // Construir el filtro para la consulta de Prisma basado en la fecha de inicio y fin (para todos los usuarios)
    const alertsFilter = {
      date: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    };

    // Obtener todos los nis_id que deberían tener datos en el rango de fechas
    const allNisIds = await prisma.alerts.findMany({
      select: {
        nis_id: true,
        users: {
          select: {
            names: true,
          },
        },
      },
      distinct: ["nis_id"],
    });

    // Inicializar el resumen de alertas para cada usuario
    allNisIds.forEach((item) => {
      const userId = item.nis_id;
      alertsSummary.push({
        nis_id: userId,
        high: 0,
        medium: 0,
        low: 0,
      });
    });

    // Obtener los resultados de las alertas para el período deseado para cada usuario
    const userAlertsSummary = await prisma.alerts.groupBy({
      by: ["nis_id", "alert_type"],
      _count: true,
      where: alertsFilter,
    });

    // Actualizar el resumen de alertas para cada usuario con los datos obtenidos
    userAlertsSummary.forEach((alert) => {
      const userId = alert.nis_id;
      const alertType = alert.alert_type;
      const alertCount = alert._count;

      const userSummary = alertsSummary.find(
        (summary) => summary.nis_id === userId
      );
      if (userSummary) {
        userSummary[alertType] = alertCount;
      }
    });

    const userAlertStatus = {};

    // Recorrer alertsSummary y obtener el estado de alerta más alto para cada usuario
    alertsSummary.forEach((summary) => {
      const userId = summary.nis_id;
      const alertsHigh = summary.high;
      const alertsMedium = summary.medium;
      const alertsLow = summary.low;

      let highestAlert = "normal";

      if (alertsHigh !== 0) {
        highestAlert = "high";
      } else if (alertsMedium !== 0) {
        highestAlert = "medium";
      } else if (alertsLow !== 0) {
        highestAlert = "low";
      }

      userAlertStatus[userId] = highestAlert;
    });

    // Obtener todos los usuarios
    const users = await prisma.users.findMany();

    // Agregar usuarios faltantes con estado normal
    users.forEach((user) => {
      if (!userAlertStatus.hasOwnProperty(user.id)) {
        userAlertStatus[user.id] = "normal";
      }
    });

    return res.json(userAlertStatus);
  } catch (error) {
    console.error("Error al obtener el resumen de alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener el resumen de alertas." });
  }
});

router.get("/alerts-summary-latest-color-total", async (req, res) => {
  try {
    const alertsSummary = [];

    // Obtener el valor del parámetro de número de días (opcional, valor predeterminado de 30 días)
    const numDays = parseInt(req.query.numDays) || 7;

    // Obtener la última fecha registrada en la tabla de alertas
    const latestAlertDateEntry = await prisma.alerts.findFirst({
      orderBy: {
        date: "desc",
      },
    });

    if (!latestAlertDateEntry) {
      return res
        .status(400)
        .json({ error: "No hay alertas registradas en la base de datos." });
    }

    const endDate = new Date(latestAlertDateEntry.date);

    // Calcular la fecha de inicio basada en la fecha final y el número de días
    const startDate = subDays(endDate, numDays);

    // Construir el filtro para la consulta de Prisma basado en la fecha de inicio y fin (para todos los usuarios)
    const alertsFilter = {
      date: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    };

    // Obtener todos los nis_id que deberían tener datos en el rango de fechas
    const allNisIds = await prisma.alerts.findMany({
      select: {
        nis_id: true,
        users: {
          select: {
            names: true,
          },
        },
      },
      distinct: ["nis_id"],
    });

    // Inicializar el resumen de alertas para cada usuario
    allNisIds.forEach((item) => {
      const userId = item.nis_id;
      alertsSummary.push({
        nis_id: userId,
        high: 0,
        medium: 0,
        low: 0,
      });
    });

    // Obtener los resultados de las alertas para el período deseado para cada usuario
    const userAlertsSummary = await prisma.alerts.groupBy({
      by: ["nis_id", "alert_type"],
      _count: true,
      where: alertsFilter,
    });

    // Actualizar el resumen de alertas para cada usuario con los datos obtenidos
    userAlertsSummary.forEach((alert) => {
      const userId = alert.nis_id;
      const alertType = alert.alert_type;
      const alertCount = alert._count;

      const userSummary = alertsSummary.find(
        (summary) => summary.nis_id === userId
      );
      if (userSummary) {
        userSummary[alertType] = alertCount;
      }
    });

    const userAlertStatus = {};

    // Recorrer alertsSummary y obtener el estado de alerta más alto para cada usuario
    alertsSummary.forEach((summary) => {
      const userId = summary.nis_id;
      const alertsHigh = summary.high;
      const alertsMedium = summary.medium;
      const alertsLow = summary.low;

      let highestAlert = "normal";

      if (alertsHigh !== 0) {
        highestAlert = "high";
      } else if (alertsMedium !== 0) {
        highestAlert = "medium";
      } else if (alertsLow !== 0) {
        highestAlert = "low";
      }

      userAlertStatus[userId] = highestAlert;
    });

    const alertCounts = {
      low: 0,
      medium: 0,
      high: 0,
    };

    Object.values(userAlertStatus).forEach((status) => {
      if (status !== "normal") alertCounts[status]++;
    });

    return res.json(alertCounts);
  } catch (error) {
    console.error("Error al obtener el resumen de alertas:", error);
    res
      .status(500)
      .json({ error: "Se produjo un error al obtener el resumen de alertas." });
  }
});

export default router;
