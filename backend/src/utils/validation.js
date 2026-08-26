const validator = require('validator')

const validateUser = (req) => {
    const { firstName, lastName, email, password, age, profileImage, gender, phone } = req.body || {}

    if (!firstName || validator.isEmpty(firstName.toString().trim())) {
        throw new Error("First name is required")
    } else if (firstName.toString().trim().length < 2) {
        throw new Error("At least 2 characters required in firstName")
    }

    if (lastName && lastName.toString().trim().length > 0 && lastName.toString().trim().length < 2) {
        throw new Error("At least 2 characters required in lastName")
    }

    if (!email || validator.isEmpty(email.toString().trim())) {
        throw new Error("Email is required")
    } else if (!validator.isEmail(email.toString().trim())) {
        throw new Error("Please provide a valid email")
    }

    if (password && !validator.isEmpty(password.toString())) {
        if (password.toString().length < 6) {
            throw new Error("Password must be at least 6 characters")
        }
    }

    if (age !== undefined && age !== null && age !== '') {
        if (Number(age) < 18 || Number(age) > 80) {
            throw new Error("Age should be between 18 to 80")
        }
    }

    if (gender && !["male", "female", "other"].includes(gender.toString().toLowerCase().trim())) {
        throw new Error("Gender must be male, female, or other")
    }
}

const validateLogin = (req) => {
    const { email, password } = req.body || {}
    if (!email || validator.isEmpty(email.toString().trim())) {
        throw new Error("Email is required")
    } else if (!validator.isEmail(email.toString().trim())) {
        throw new Error("Please provide a valid email")
    }

    if (!password || validator.isEmpty(password.toString())) {
        throw new Error("Password is required")
    }
}

const validateUserUpdate = (req) => {
    const { firstName, lastName, password, age } = req.body || {}

    if (firstName && validator.isLength(firstName, { min: 20 })) {
        throw new Error("Please provide first name less than 20 characters")
    }
    if (lastName && validator.isLength(lastName, { min: 20 })) {
        throw new Error("Please provide last name less than 20 characters")
    }
    if (password && validator.isLength(password, { min: 20 })) {
        throw new Error("Please provide password between 8 to 20 characters")
    } else if (age && (Number(age) < 15 || Number(age) > 60)) {
        throw new Error("Please provide age between 15 to 60.")
    }
}

module.exports = { validateUser, validateLogin, validateUserUpdate }
