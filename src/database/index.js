import mongoose from "mongoose";
import { EXAMPLEURL } from "../constants.js";

const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(
            `${process.env.MONGOOSEDB_URI}/${EXAMPLEURL}`
        );
        console.log(
            `\nDatabase Connected SUCCESSFULLY !! DB Host: ${connectInstance.connection.host}`
        );
    } catch (error) {
        console.error("Database Connection FAILED:", error);
        process.exit(1);
    }
};

export default connectDB;
