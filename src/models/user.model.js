import mongoose, { Schema } from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            require: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            require: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: [{ type: Schema.Types.ObjectId, ref: "Vedio" }],
        password: {
            type: String,
            require: [true, "Password is required"],
        },
        refreshToken: { type: String },
    },

    { timestamps: true }
);

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = bcrypt.hash(this.password, 8);
    next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
    return Jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullname: this.fullname,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};
UserSchema.methods.generateRefreshToken = function () {
    return Jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", UserSchema);
