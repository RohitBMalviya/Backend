import multer from "multer";

const storage = multer.diskStorage({
    destination: function (request, file, cd) {
        cd(null, "./public/temp");
    },
    filename: function (request, file, cd) {
        cd(null, file.originalname);
    },
});

export const upload = multer({ storage });
