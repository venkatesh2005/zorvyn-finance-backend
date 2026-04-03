const mongoose = require("mongoose");
const Record = require("../models/record.model");
const { escapeRegex, parseRecordSort } = require("../utils/queryHelpers");

/**
 * GET /api/records
 * Viewer, Analyst, Admin - list records with filters & pagination
 */
const getAllRecords = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 10,
      sort,
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.description = { $regex: escapeRegex(search), $options: "i" };
    }

    const sortSpec = parseRecordSort(sort);
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Record.find(filter)
        .populate("createdBy", "name email role")
        .sort(sortSpec)
        .skip(skip)
        .limit(Number(limit)),
      Record.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/records/:id
 */
const getRecordById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid record ID." });
    }
    const record = await Record.findById(req.params.id).populate("createdBy", "name email");
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }
    res.json({ success: true, data: { record } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/records
 * Admin, Analyst
 */
const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    const record = await Record.create({
      amount,
      type,
      category,
      date: date || new Date(),
      description,
      createdBy: req.user._id,
    });

    await record.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Financial record created.",
      data: { record },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/records/:id
 * Admin only
 */
const updateRecord = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid record ID." });
    }

    const { amount, type, category, date, description } = req.body;
    const patch = {};
    if (amount !== undefined) patch.amount = amount;
    if (type !== undefined) patch.type = type;
    if (category !== undefined) patch.category = category;
    if (date !== undefined) patch.date = date;
    if (description !== undefined) patch.description = description;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update (amount, type, category, date, description).",
      });
    }

    const record = await Record.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email");

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    res.json({ success: true, message: "Record updated.", data: { record } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/records/:id
 * Admin only - soft delete
 */
const deleteRecord = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid record ID." });
    }
    const record = await Record.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }
    res.json({ success: true, message: "Record deleted (soft)." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRecords, getRecordById, createRecord, updateRecord, deleteRecord };
