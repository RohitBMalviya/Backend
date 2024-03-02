import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelDetail,
    getUserWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.midddleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshtoken").post(refreshAccessToken);
router.route("/changepassword").post(verifyJWT, changeUserPassword);
router.route("/getcurrentuser").get(verifyJWT, getCurrentUser);
router.route("/updateuserdetail").patch(verifyJWT, updateUserDetail);
router
    .route("/updateuseravatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/updateusercoverimage")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelDetail);
router.route("/userwatchhistory").get(verifyJWT, getUserWatchHistory);

export default router;
