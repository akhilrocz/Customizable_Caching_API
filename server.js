require("dotenv").config();

const express = require("express");

const mongoose = require("mongoose");

const app = express();

const MAX_CACHE_SIZE = 10;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })

  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

const cacheSchema = new mongoose.Schema({
  key: { type: String, unqiue: true, required: true },
  value: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now() },
});

cacheSchema.index({ createdAt: 1 });

const Cache = mongoose.model("Cache", cacheSchema);

app.use(express.json());

app.post("/cache", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ message: "Key and value are required" });
    }

    const cacheCount = await Cache.countDocuments();

    if (cacheCount >= MAX_CACHE_SIZE) {
      res
        .status(404)
        .json({ message: "Cache is full, and cannot add more entries" });
    }

    const newCacheEntry = await Cache({ key, value });
    newCacheEntry.save();
    res.json({ message: "Cache entry stored successfully", newCacheEntry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/cache/:key", async (req, res) => {
  try {
    const key = req.params.key;
    const cacheEntry = await Cache.findOne({ key });
    if (!cacheEntry) {
      return res.status(404).json({ message: "Cache entry not found" });
    }
    res.json({ key, value: cacheEntry.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/cache/:key", async function (req, res) {
  try {
    const key = req.params.key;
    const output = await Cache.findOneAndDelete({ key });
    if (!output) {
      return res.status(404).json({ message: "Cache entry not found" });
    }
    res.status(200).json({ message: "cache entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
