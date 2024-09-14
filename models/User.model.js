const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  setting: { type: mongoose.Schema.ObjectId, ref: "Setting" },
});

const UserModel = mongoose?.models?.User || mongoose.model("User", UserSchema);

module.exports = UserModel;
