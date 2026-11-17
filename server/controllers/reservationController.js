
const { Op } = require("sequelize");
const { Reservation } = require("../models");

const validStatuses = [
  "pending",
  "confirmed",
  "seated",
  "cancelled",
  "no_show",
];

const getReservations = async (req, res) => {
  try {
    const { date, status, search } = req.query;

    const where = {
      restaurantId: req.restaurantId,
      branchId: req.branchId,
    };

    if (date) where.reservationDate = date;
    if (status && validStatuses.includes(status)) {
      where.status = status;
    }

    if (search?.trim()) {
      where[Op.or] = [
        { customerName: { [Op.like]: `%${search.trim()}%` } },
        { phone: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    const reservations = await Reservation.findAll({
      where,
      order: [
        ["reservationDate", "ASC"],
        ["reservationTime", "ASC"],
      ],
    });

    return res.json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("GET RESERVATIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch reservations",
    });
  }
};

const createReservation = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      partySize,
      reservationDate,
      reservationTime,
      notes,
    } = req.body;

    const size = Number(partySize);

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      customerName.trim().length > 100 ||
      typeof phone !== "string" ||
      !phone.trim() ||
      phone.trim().length > 25 ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(reservationDate || "") ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(reservationTime || "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid reservation details",
      });
    }

    const dateCheck = new Date(`${reservationDate}T00:00:00.000Z`);

    if (
      Number.isNaN(dateCheck.getTime()) ||
      dateCheck.toISOString().slice(0, 10) !== reservationDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation date",
      });
    }

    const reservation = await Reservation.create({
      restaurantId: req.restaurantId,
      branchId: req.branchId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      partySize: size,
      reservationDate,
      reservationTime,
      notes: typeof notes === "string" ? notes.trim() : null,
    });

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    console.error("CREATE RESERVATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create reservation",
    });
  }
};

const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
        branchId: req.branchId,
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    const { status, notes } = req.body;

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reservation status",
        });
      }

      reservation.status = status;
    }

    if (notes !== undefined) {
      reservation.notes =
        typeof notes === "string" ? notes.trim() : null;
    }

    await reservation.save();

    return res.json({
      success: true,
      message: "Reservation updated successfully",
      reservation,
    });
  } catch (error) {
    console.error("UPDATE RESERVATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update reservation",
    });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.restaurantId,
        branchId: req.branchId,
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    await reservation.destroy();

    return res.json({
      success: true,
      message: "Reservation deleted successfully",
    });
  } catch (error) {
    console.error("DELETE RESERVATION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete reservation",
    });
  }
};

module.exports = {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
};
