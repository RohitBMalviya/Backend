import app from "./app.js";
import connectDB from "./database/index.js";
import dotenv from "dotenv";
dotenv.config({ path: "./env" });
const PORT = process.env.PORT || 5000;
connectDB()
    .then(() => {
        // app.on("App Connection Error", (error) => {
        //     console.log("ERROR: ", error);
        //     throw error;
        // });
        app.listen(PORT, () => {
            console.log(
                `Database with APP Connected SUCCESSFULLY on port http://localhost:${PORT}`
            );
        });
    })
    .catch((error) =>
        console.log("Database with APP Connection FAILED: ", error)
    );

/*
import mongoose from "mongoose";
import "dotenv/config";
import express from "express";
import { EXAMPLEURL } from "./constants.js";
const app = express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGOOSEDB_URI}/${EXAMPLEURL}`);
        app.on("ERROR", (error) => {
            console.log("ERROR: ", error);
            throw error;
        });
        app.listen(process.env.PORT, () => {
            console.log(
                `Server is running on the port http://localhost:${process.env.PORT}`
            );
        });
    } catch (error) {
        console.error("Mongoose Failed ERROR: ", error);
        // throw error;
    }
})();
*/
