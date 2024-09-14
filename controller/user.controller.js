const jwt = require("jsonwebtoken");
const UserModel = require("../models/User.model.js");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const haveUser = await UserModel.find();

    if (haveUser?.length === 0) {
      const registeredUser = new UserModel({ email, password });
      await registeredUser.save();
    }

    const user = await UserModel.findOne({ email, password }).lean();

    if (!user) throw { message: "Invalid Email or Password" };
    delete user.password;

    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "7 days",
    });

    res.status(200).send({ accessToken: token });
  } catch (error) {
    res.status(500).send(error);
  }
};

const update = async (req, res) => {
  try {
    const { email, password } = req.body;
    await UserModel.findOneAndUpdate(
      { _id: req?.user._id },
      { email, password }
    ).lean();

    res.status(200).send("success");
  } catch (error) {
    res.status(500).send(error);
  }
};

const me = async (req, res) => {
  try {
    const user = await UserModel.findById(req?.user._id).populate("setting");

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = { login, me, update };
