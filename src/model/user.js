const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      uppercase: true,
      trim: true,
    },

    lastName: {
      type: String,
      uppercase: true,
      trim: true,
    },

    password: {
      type: String,
      validate: {
        validator: function (value) {
          if (!validator.isStrongPassword(value)) {
            throw new Error("Please provide a strong password");
          }
          return true;
        },
      },
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          if (!validator.isEmail(value)) {
            throw new Error("Invalid email format");
          }
          return true;
        },
      },
    },

    age: {
      type: Number,
      min: 18,
      max: 65,
    },

    skills: {
      type: [String],
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    profileImage: {
      type: String,
      validate: {
        validator: function (value) {
          if (value && !validator.isURL(value)) {
            throw new Error("Please provide correct image url");
          }
          return true;
        },
      },
    },

    phone: {
      type: Number,
      validate: {
        validator: function (value) {
          if (value && !validator.isMobilePhone(value.toString())) {
            throw new Error("Please provide correct mobile number");
          }
          return true;
        },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.methods.getToken = async function () {
  const user = this;

  if (!process.env.JWT_SECRET) {
    throw new Error("Please provide private key");
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return token;
};

userSchema.methods.validatePassword = async function (password) {
  const user = this;
  const checkPassword = await bcrypt.compare(password, user.password);
  return checkPassword;
};

const user = mongoose.model("user", userSchema);

module.exports = user;