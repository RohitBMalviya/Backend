import mongoose from "mongoose";

const tweetSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            require: true,
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
