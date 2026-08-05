const validator = require("validator");

const validateUser = (req) => {
  const {
    firstName,
    lastName,
    password,
    email,
    age,
    gender,
    profileImage,
    phone,
    skills,
  } = req.body;

  if (validator.isEmpty(String(firstName || ""))) {
    throw new Error("FirstName is required");
  } else if (!validator.isLength(String(firstName), { min: 4 })) {
    throw new Error("FirstName length should be at least 4 characters");
  }

  if (validator.isEmpty(String(lastName || ""))) {
    throw new Error("LastName is required");
  } else if (!validator.isLength(String(lastName), { min: 4 })) {
    throw new Error("LastName length should be at least 4 characters");
  }

  if (validator.isEmpty(String(password || ""))) {
    throw new Error("Password is required");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number and symbol."
    );
  }

  if (validator.isEmpty(String(email || ""))) {
    throw new Error("Email is required");
  } else if (!validator.isEmail(email)) {
    throw new Error("Please enter a valid email address");
  }

  if (validator.isEmpty(String(age || ""))) {
    throw new Error("Age is required");
  } else if (!validator.isInt(String(age), { min: 18, max: 60 })) {
    throw new Error("Age must be between 18 and 60");
  }

  if (validator.isEmpty(String(phone || ""))) {
    throw new Error("Phone number is required");
  } else if (!validator.isMobilePhone(String(phone), "en-IN")) {
    throw new Error("Please enter a valid Indian phone number");
  }

  if (validator.isEmpty(String(gender || ""))) {
    throw new Error("Gender is required");
  } else if (!["male", "female", "other"].includes(gender)) {
    throw new Error("Gender must be Male, Female, or Other");
  }

  if (validator.isEmpty(String(profileImage || ""))) {
    throw new Error("Profile image URL is required");
  } else if (!validator.isURL(profileImage)) {
    throw new Error("Please enter a valid profile image URL");
  }

  if (!Array.isArray(skills)) {
    throw new Error("Skills must be an array");
  } else if (skills.length === 0) {
    throw new Error("At least one skill is required");
  }
};

const validateLogin = (req) => {
  const { email, password } = req.body;

  if (validator.isEmpty(String(email || ""))) {
    throw new Error("Email is required");
  } else if (!validator.isEmail(email)) {
    throw new Error("Please enter a valid email address");
  }

  if (validator.isEmpty(String(password || ""))) {
    throw new Error("Password is required");
  }
};

const validateUserUpdate = (req) => {
  const {
    firstName,
    lastName,
    password,
    age,
  } = req.body;

  if (firstName && (firstName.length > 20 || firstName.length < 2)) {
    throw new Error("Please provide first name between 2 and 20 characters");
  }

  if (lastName && (lastName.length > 20 || lastName.length < 2)) {
    throw new Error("Please provide last name between 2 and 20 characters");
  }

  if (password && !validator.isLength(password, { min: 8, max: 20 })) {
    throw new Error("Please provide password between 8 to 20 characters");
  }

  if (age && (age < 15 || age > 60)) {
    throw new Error("Please provide age between 15 to 60.");
  }
};

module.exports = { validateUser, validateLogin, validateUserUpdate };