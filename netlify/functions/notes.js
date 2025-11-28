const mongoose = require("mongoose");

// MongoDB connection
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const db = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedDb = db;
  return db;
};

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

const Note = mongoose.models.Note || mongoose.model("Note", noteSchema);

// Handler
exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    };

    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: "",
      };
    }

    // GET all notes
    if (event.httpMethod === "GET" && !event.path.includes("/notes/")) {
      const notes = await Note.find().sort({ createdAt: -1 });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(notes),
      };
    }

    // POST new note
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const newNote = new Note({
        name: body.name,
        date: body.date,
        data: body.data,
      });
      const savedNote = await newNote.save();
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(savedNote),
      };
    }

    // DELETE note by ID
    if (event.httpMethod === "DELETE") {
      const pathParts = event.path.split("/");
      const id = pathParts[pathParts.length - 1];

      const deletedNote = await Note.findByIdAndDelete(id);
      if (!deletedNote) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "Note not found" }),
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Note deleted" }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
