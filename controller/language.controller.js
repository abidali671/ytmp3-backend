const LanguageModel = require("../models/Language.model.js");
const SettingModel = require("../models/Setting.model.js");

const addLanguage = async (req, res) => {
  try {
    const { name, code, country_code } = req.body;
    const registeredLanguage = await LanguageModel.findOne({
      $or: [{ name }, { code }],
    });

    if (registeredLanguage) throw { message: "Language already registered" };

    const newLanguage = new LanguageModel({ name, code, country_code });
    await newLanguage.save();

    res.status(200).send(newLanguage);
  } catch (error) {
    res.status(500).send(error);
  }
};

const updateLanguage = async (req, res) => {
  try {
    const { _id, ...data } = req.body;
    await LanguageModel.findByIdAndUpdate(_id, data);

    res.status(200).send("success");
  } catch (error) {
    res.status(500).send(error);
  }
};

const getLanguages = async (_, res) => {
  try {
    const { disabledLanguages } = await SettingModel.findOne()
      .select({ pages: 0, __v: 0, _id: 0 })
      .lean();
    const languages = await LanguageModel.find().lean();

    const filteredLanguages = languages.filter(
      (d) => !disabledLanguages.includes(d.code)
    );

    res.status(200).send(filteredLanguages);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getAllLanguages = async (_, res) => {
  try {
    const languages = await LanguageModel.find().lean();

    res.status(200).send(languages);
  } catch (error) {
    res.status(500).send(error);
  }
};
module.exports = { addLanguage, updateLanguage, getLanguages, getAllLanguages };
