import multer from "multer";
import path from "path";
import LoggerInstance from "../../loaders/commons/logger";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../public'))
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

export const upload =  multer({ storage })