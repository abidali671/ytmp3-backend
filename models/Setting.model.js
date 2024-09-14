const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema({
  defaultLanguage: String,
  disabledLanguages: [String],
  disabledPages: [String],
  globalSlug: String,
  advertisement: Object,
  header: String,
  pages: Object,
  logo: String,
});

const SettingModel =
  mongoose?.models?.Setting || mongoose.model("Setting", SettingSchema);

module.exports = SettingModel;
