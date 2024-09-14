const jwt = require("jsonwebtoken");

async function Authenticate(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded_token = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded_token;

    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication Failed" });
  }
}

module.exports = Authenticate;
