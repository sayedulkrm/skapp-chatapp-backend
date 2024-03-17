import multer from "multer";

const storage = multer.memoryStorage();

const multerUpload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
});
// .single("file");

export default multerUpload;
