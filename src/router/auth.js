const express = require("express");
const router = express.Router();
const userModel = require("../model/user");
const auth = require("../utils/authToken");
const {
  validateUser,
  validateLogin,
  validateUserUpdate,
} = require("../utils/validation");
const bcrypt = require("bcrypt");


// create a new user
router.post("/signup", async (req, res) => {
  try {
    validateUser(req);

    const {
      firstName,
      lastName,
      email,
      password,
      age,
      gender,
      profileImage,
      phone,
      skills,
    } = req.body;

    const hashPassword = await bcrypt.hash(
      password,
      Number(process.env.SALT_ROUND)
    );

    const user = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
      age,
      gender,
      profileImage,
      phone,
      skills,
    });

    res.status(201).send({
      status: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message,
    });
  }
});


// Login route
router.post("/login", async (req, res) => {
  try {
    validateLogin(req);
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await user.validatePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).send({
        status: false,
        message: "Invalid password",
      });
    }

    const token = await user.getToken();

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.send({
      status: true,
      message: "Login successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).send({
      status: false,
      message: err.message,
    });
  }
});

module.exports = router;