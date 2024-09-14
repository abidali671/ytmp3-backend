const SettingModel = require("../models/Setting.model.js");
const UserModel = require("../models/User.model.js");
const PageModel = require("../models/Pages.model.js");

const createSetting = async (req, res) => {
  try {
    const setting = new SettingModel(req.body);
    await setting.save();

    await UserModel.findByIdAndUpdate(req.user._id, { setting });

    res.status(200).send(setting);
  } catch (error) {
    res.status(500).send(error);
  }
};

const editSetting = async (req, res) => {
  try {
    const setting = await SettingModel.findOneAndUpdate({}, req.body).lean();

    res.status(201).send(setting);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getSetting = async (_, res) => {
  try {
    const setting = await SettingModel.findOne()
      .select({ pages: 0, __v: 0, _id: 0 })
      .lean();

    res.status(200).send(setting);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  createSetting,
  editSetting,
  getSetting,
};
