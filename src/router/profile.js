const express = require("express");
const router = express.Router();
const userModel = require("../model/user");
const auth = require("../utils/authToken");
const { validateUserUpdate } = require("../utils/validation");

// profile route
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await userModel.findById(req.userId || req.user._id);

    res.send({
      status: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: false,
      message: err.message,
    });
  }
});

// get user by id
router.get("/users/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }
    res.send({
      status: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).send({
      status: false,
      message: err.message,
    });
  }
});

// update user by logged-in user
router.patch("/updateProfile", auth, async (req, res) => {
  try {
    validateUserUpdate(req);

    const userId = req.userId || req.user._id;

    const updateAllowedFields = [
      "firstName",
      "lastName",
      "age",
      "skills",
      "profileImage",
      "phone",
    ];

    const isValidOperation = Object.keys(req.body).every((key) =>
      updateAllowedFields.includes(key)
    );

    if (!isValidOperation) {
      throw new Error("Invalid field present in update request");
    }

    const userData = await userModel.findByIdAndUpdate(
      userId,
      { $set: req.body },
      {
        runValidators: true,
        returnDocument: "after",
      }
    );

    res.send({
      status: !!userData,
      message: userData
        ? "User updated successfully"
        : "User data not found",
      data: userData,
    });
  } catch (error) {
    res.status(400).send({
      status: false,
      message: error.message,
    });
  }
});

// delete user by id
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id);

    res.send({
      status: true,
      message: "User deleted successfully",
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