import asyncHandler from "../utils/handler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadFile from "../utils/fileUpload.js";
import ApiRespone from "../utils/ApiRespone.js";

const registerUser = asyncHandler(async (request, response) => {
    // response.status(200).json({
    //     message: "ok",
    // });

    const { fullname, email, password, username } = request.body;
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
    console.log("heeeeee", avatarLocalPath);
    const coverImageLocalPath = request.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "avartarLocalPath Avatar file is  required");
    }

    const avatar = await uploadFile(avatarLocalPath);
    const coverImage = await uploadFile(coverImageLocalPath);
    console.log("adf", avatar);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || null,
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

export default registerUser;
