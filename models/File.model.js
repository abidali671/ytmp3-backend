const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  filename: { type: String, unique: true },
  path: { type: String, unique: true },
  contentType: String,
  size: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FileModel = mongoose?.models?.File || mongoose.model("file", FileSchema);

module.exports = FileModel;
