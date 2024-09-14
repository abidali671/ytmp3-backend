const mongoose = require("mongoose");

const RedirectSchema = new mongoose.Schema({
  path: String,
  to: String,
});

const RedirectModel =
  mongoose?.models?.Redirect || mongoose.model("Redirect", RedirectSchema);

module.exports = RedirectModel;
