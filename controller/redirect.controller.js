const RedirectModel = require("../models/Redirect.model");

const getRedirects = async (_, res) => {
  try {
    const redirects = await RedirectModel.find();
    res.status(200).send(redirects);
  } catch (error) {
    res.status(500).send(error?.response);
  }
};

const deleteRedirect = async (req, res) => {
  try {
    const { id } = req.params;
    await RedirectModel.findOneAndDelete({ _id: id });
    res.status(200).send("success");
  } catch (error) {
    res.status(500).send(error?.response);
  }
};

const editRedirect = async (req, res) => {
  try {
    const { id } = req.params;
    const redirect = await RedirectModel.findOneAndUpdate(
      { _id: id },
      req.body
    );
    res.status(200).send(redirect);
  } catch (error) {
    res.status(500).send(error?.response);
  }
};

const createRedirect = async (req, res) => {
  try {
    const { path, to } = req.body;

    const redirect = new RedirectModel({ path, to });

    await redirect.save();
    res.status(200).send(redirect);
  } catch (error) {
    res.status(500).send(error?.response);
  }
};

module.exports = { createRedirect, editRedirect, deleteRedirect, getRedirects };
