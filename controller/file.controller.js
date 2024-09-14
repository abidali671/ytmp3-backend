const FileModel = require("../models/File.model");
const fs = require("fs");
const path = require("path");

const createFile = async (req, res) => {
  try {
    const file = new FileModel({
      filename: req.file.filename,
      path: "/media/" + req.file.filename,
      contentType: req.file.mimetype,
      size: req.file.size,
    });
    await file.save();
    res.status(200).json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id, path: filePath } = req.query;

    fs.unlink(path.resolve(__dirname, ".." + filePath), (err) => {
      if (err) {
        return;
      }
    });

    await FileModel.findByIdAndDelete(id);

    res.status(200).json("success");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await FileModel.find();
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createFile, getFiles, deleteFile };
