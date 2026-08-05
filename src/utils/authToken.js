const jwt = require("jsonwebtoken");
const userModel = require("../model/user");

require("dotenv").config();

const userAuth = async (req, res, next) => {
  try {
    const token = req?.cookies?.token;

    if (!token) {
      throw new Error("Please provide token");
    }

    const decodeToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decodeToken) {
      throw new Error("Invalid Token");
    }

    const userExist = await userModel.findById(decodeToken.userId);

    if (!userExist) {
      throw new Error("Incorrect token");
    }

    req.user = userExist;
    req.userId = userExist._id;

    console.log("req.userId", req.userId);

    next();
  } catch (err) {
    res.status(401).json({
      status: false,
      message: err.message,
    });
  }
};

module.exports = userAuth;