const express = require("express");
const router = express.Router();
const userAuth = require("../utils/authToken");
const connectionModel = require("../model/connection");

router.post("/sendConnection/:toUserId/:status", userAuth, async (req, res) => {
  try {
    const { toUserId, status } = req.params;
    const fromUserId = req.userId;

    const connectObj = {
      fromUserId,
      toUserId,
      status,
    };

    const requestExist = await connectionModel.exists({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId }
      ]
    });

    if (requestExist) {
      return res.send({
        status: false,
        message: "Request already exists",
      });
    }

    const sendRequest = new connectionModel(connectObj);
    await sendRequest.save();

    res.send({
      status: true,
      message: "send request successfully",
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      message: err.message,
    });
  }
});

router.post("/logout", userAuth, async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send({
    status: true,
    message: "Logout successful",
  });
});

module.exports = router;