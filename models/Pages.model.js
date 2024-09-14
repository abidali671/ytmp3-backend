const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema(
  {
    type: { type: String, unique: true, required: true },
  },
  { strict: false }
);

const PageModel = mongoose?.models?.Page || mongoose.model("Page", PageSchema);

module.exports = PageModel;
