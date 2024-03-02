import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            require: true,
        },
        video: {
            type: mongoose.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
