import asyncHandler from "../utils/handler.js";

const registerUser = asyncHandler(async (resquest, response) => {
    response.status(200).json({
        message: "ok",
    });
});

export default registerUser;
