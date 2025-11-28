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

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
