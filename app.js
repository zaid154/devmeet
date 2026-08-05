const cookieParser = require("cookie-parser");
const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const connectDB = require("./src/config/database");

const AuthRouter = require("./src/router/auth");
const ProfileRouter = require("./src/router/profile");
const RequestRouter = require("./src/router/request");

app.use(express.json());
app.use(cookieParser());

app.use("/", AuthRouter);
app.use("/", ProfileRouter);
app.use("/", RequestRouter);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));