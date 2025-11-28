require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// Schema
const noteSchema = new mongoose.Schema({
  name: String,
  date: String,
  data: {
    buyPrice: Number,
    sellPrice: Number,
    shares: Number,
    taxRate: Number,
    netProfit: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Note = mongoose.model("Note", noteSchema);

// Operation Schema
const operationSchema = new mongoose.Schema({
  name: String,
  purchaseDate: String,
  buyPrice: Number,
  shares: Number,
  totalCost: Number,
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
  // Fields only populated when closed
  sellPrice: Number,
  sellDate: String,
  taxRate: {
    type: Number,
    default: 19,
  },
  grossProfit: Number,
  taxAmount: Number,
  netProfit: Number,
  profitPercentage: Number,
  durationDays: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Operation = mongoose.model("Operation", operationSchema);

// Routes
app.get("/api/notes", async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const newNote = new Note({
      name: req.body.name,
      date: req.body.date,
      data: req.body.data,
    });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    console.log("DELETE request for ID:", req.params.id);
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    console.log("Deleted note:", deletedNote);
    if (!deletedNote) {
      console.log("Note not found");
      return res.status(404).json({ message: "Note not found" });
    }
    res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Operations Routes
app.get("/api/operations", async (req, res) => {
  try {
    const operations = await Operation.find().sort({ createdAt: -1 });
    res.json(operations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/operations", async (req, res) => {
  try {
    const newOperation = new Operation({
      name: req.body.name,
      purchaseDate: req.body.purchaseDate,
      buyPrice: req.body.buyPrice,
      shares: req.body.shares,
      totalCost: req.body.totalCost,
    });
    const savedOperation = await newOperation.save();
    res.status(201).json(savedOperation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch("/api/operations/:id/close", async (req, res) => {
  try {
    const operation = await Operation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ message: "Operation not found" });
    }

    const { sellPrice, sellDate, taxRate } = req.body;

    // Calculate metrics
    const grossProfit = (sellPrice - operation.buyPrice) * operation.shares;
    const taxAmount = grossProfit > 0 ? grossProfit * (taxRate / 100) : 0;
    const netProfit = grossProfit - taxAmount;
    const profitPercentage = (grossProfit / operation.totalCost) * 100;

    // Calculate duration in days
    const purchaseDate = new Date(operation.purchaseDate);
    const saleDate = new Date(sellDate);
    const durationDays = Math.floor((saleDate - purchaseDate) / (1000 * 60 * 60 * 24));

    // Update operation
    operation.status = "closed";
    operation.sellPrice = sellPrice;
    operation.sellDate = sellDate;
    operation.taxRate = taxRate;
    operation.grossProfit = grossProfit;
    operation.taxAmount = taxAmount;
    operation.netProfit = netProfit;
    operation.profitPercentage = profitPercentage;
    operation.durationDays = durationDays;

    const updatedOperation = await operation.save();
    res.json(updatedOperation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/operations/:id", async (req, res) => {
  try {
    const deletedOperation = await Operation.findByIdAndDelete(req.params.id);
    if (!deletedOperation) {
      return res.status(404).json({ message: "Operation not found" });
    }
    res.json({ message: "Operation deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
