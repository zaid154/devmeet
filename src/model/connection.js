const mongoose = require("mongoose");
const { Schema } = mongoose;

const connectionSchema = new Schema(
    {
        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        toUserId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ["accepted", "rejected", "pending"],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("connection", connectionSchema);