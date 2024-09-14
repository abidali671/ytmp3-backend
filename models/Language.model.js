const mongoose = require("mongoose");

const LanguageSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  code: { type: String, unique: true },
  flag: { type: String },
  country_code: { type: String },
});

const LanguageModel =
  mongoose?.models?.Language || mongoose.model("Language", LanguageSchema);

module.exports = LanguageModel;
