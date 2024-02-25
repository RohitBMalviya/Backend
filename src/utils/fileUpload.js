import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFile = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        const respone = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // console.log("File Uploaded", respone.url);
        fs.unlinkSync(localFilePath);
        return respone;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        localFilePath;
        return null;
    }
};

export default uploadFile;
