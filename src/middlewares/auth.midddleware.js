import ApiError from "../utils/ApiError.js";
import Jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = async (request, respone, next) => {
    try {
        const token =
            (await request.cookies?.accessToken) ||
            request.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "UnAuthorized Request");
        }
        const decodedToken = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        request.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
};
