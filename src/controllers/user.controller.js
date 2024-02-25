import asyncHandler from "../utils/handler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadFile from "../utils/fileUpload.js";
import ApiRespone from "../utils/ApiRespone.js";

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
        coverImageLocalPath = request.files.coverImage[0].path;
    }
    const coverImage = await uploadFile(coverImageLocalPath);

    const user = await User.create({
        fullname,
        avatar: avatar.url,
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
    console.log(request.body);

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
        request.user._id,
        {
            $set: { refreshToken: undefined },
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
