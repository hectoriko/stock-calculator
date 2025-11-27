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
const calculationSchema = new mongoose.Schema({
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

const Calculation = mongoose.model("Calculation", calculationSchema);

// Routes
app.get("/api/calculations", async (req, res) => {
  try {
    const calculations = await Calculation.find().sort({ createdAt: -1 });
    res.json(calculations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/calculations", async (req, res) => {
  try {
    const newCalculation = new Calculation({
      name: req.body.name,
      date: req.body.date,
      data: req.body.data,
    });
    const savedCalculation = await newCalculation.save();
    res.status(201).json(savedCalculation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/calculations/:id", async (req, res) => {
  try {
    console.log("DELETE request for ID:", req.params.id);
    const deletedCalculation = await Calculation.findByIdAndDelete(req.params.id);
    console.log("Deleted calculation:", deletedCalculation);
    if (!deletedCalculation) {
      console.log("Calculation not found");
      return res.status(404).json({ message: "Calculation not found" });
    }
    res.json({ message: "Calculation deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
