import asyncHandler from "../utils/handler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadFile from "../utils/fileUpload.js";
import ApiRespone from "../utils/ApiRespone.js";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating the token"
        );
    }
};

export const registerUser = asyncHandler(async (request, response) => {
    // response.status(200).json({
    //     message: "ok",
    // });

    const { fullname, email, password, username } = request.body;
    // console.log(request.body);
    // console.table([fullname, email, password, username]);
    if (
        [fullname, email, password, username].some(
            (fields) => fields?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All Fields is Required");
    }

    const userExist = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (userExist) {
        throw new ApiError(409, "Username and Email already exist");
    }

    const avatarLocalPath = request.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is  required");
    }

    const avatar = await uploadFile(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    // console.log("adf", avatar);

    // const coverImageLocalPath = request.files?.coverImage[0]?.path;
    // console.log(request.files);
    let coverImageLocalPath;
    if (
        request.files &&
        Array.isArray(request.files.coverImage) &&
        request.files.coverImage.length > 0
    ) {
        coverImageLocalPath = request.files?.coverImage[0]?.path;
    }
    const coverImage = await uploadFile(coverImageLocalPath);

    const user = await User.create({
        fullname,
        avatar: avatar.url || "",
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something  went wrong while Registering the User"
        );
    }

    return response
        .status(201)
        .json(new ApiRespone(200, createdUser, "User Register Successfully"));
});

export const loginUser = asyncHandler(async (request, response) => {
    // response.status(200).json({
    //     message: "Login User Creating",
    // });

    const { email, username, password } = request.body;
    // console.log(request.body);

    if (!(email || username)) {
        throw new ApiError(400, "Username or Email is Required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "Username or Email not Exist");
    }

    const checkPassword = await user.isPasswordCorrect(password);

    if (!checkPassword) {
        throw new ApiError(401, "Invalid Password!!");
    }
    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const option = {
        httpOnly: true,
        secure: true,
    };

    return response
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiRespone(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User Logged In Successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (request, response) => {
    await User.findByIdAndUpdate(
        request.user?._id,
        {
            $unset: { refreshToken: 1 },
        },
        { new: true }
    );
    const option = {
        httpOnly: true,
        secure: true,
    };
    return response
        .status(200)
        .clearCookie("refreshToken", option)
        .clearCookie("accessToken", option)
        .json(new ApiRespone(200, {}, "User Logged out Successfully"));
});

export const refreshAccessToken = asyncHandler(async (request, response) => {
    const incomingToken =
        request.cookies.refreshToken || request.body.refreshToken;

    if (!incomingToken) {
        throw new ApiError(401, "unAuthorized Request");
    }
    try {
        const decodedToken = Jwt.verify(
            incomingToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        // console.log(decodedToken);
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if (incomingToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const option = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessandRefreshToken(user._id);

        return response
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("newRefreshToken", newRefreshToken, option)
            .json(
                new ApiRespone(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Refresh Successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token");
    }
});

export const changeUserPassword = asyncHandler(async (request, response) => {
    const { oldPassword, newPassword } = request.body;

    const user = await User.findById(request.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return response
        .status(200)
        .json(new ApiRespone(200, {}, "Password Change Successfully"));
});

export const getCurrentUser = asyncHandler(async (request, response) => {
    return response
        .status(200)
        .json(
            new ApiRespone(200, request.user, "Current User Fetch Successfully")
        );
});

export const updateUserDetail = asyncHandler(async (request, response) => {
    const { fullname, email } = request.body;

    if (!(fullname || email)) {
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(
        request.user?._id,
        { $set: { fullname: fullname, email: email } },
        {}
    ).select("-password");
    // console.log(user);

    return response
        .status(200)
        .json(new ApiRespone(200, user, "User detail Update Successfully"));
});

export const updateUserAvatar = asyncHandler(async (request, response) => {
    const avatarLocalPath = request.file?.path;
    // console.log("aaaa", request.file);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing");
    }
    const avatar = await uploadFile(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Avatar is not uploaded");
    }

    const user = await User.findByIdAndUpdate(
        request.user._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true }
    ).select("-password");

    response
        .status(200)
        .json(new ApiRespone(200, user, "Avatar Update Successfully"));
});

export const updateUserCoverImage = asyncHandler(async (request, response) => {
    // console.log("body", request.file);
    const coverImageLocalPath = request.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is missing");
    }
    const coverImage = await uploadFile(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "coverImage is not uploaded");
    }

    const user = await User.findByIdAndUpdate(
        request.user._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        { new: true }
    ).select("-password");

    response
        .status(200)
        .json(new ApiRespone(200, user, "coverImage Update Successfully"));
});

export const getUserChannelDetail = asyncHandler(async (request, response) => {
    const { username } = request.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscriberToCount: {
                    $size: "$subscribeTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [request.user?._id, "$subscribers.subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                email: 1,
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscriberToCount: 1,
                isSubscribed: 1,
            },
        },
    ]);
    if (!channel?.length) {
        throw new ApiError(400, "Channel does not exists");
    }
    response
        .status(200)
        .json(new ApiRespone(200, channel[0], "Channel Fetch Successfully"));
});

export const getUserWatchHistory = asyncHandler(async (request, response) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(request.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);
    // console.log(user);
    response
        .status(200)
        .json(
            new ApiRespone(
                200,
                user[0].watchHistory,
                "WatchHistory Fetch Successfully"
            )
        );
});
