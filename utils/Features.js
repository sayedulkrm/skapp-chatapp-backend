import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import { getBase64 } from "../lib/helper.js";

export const emitEvent = (req, event, users, data) => {
    console.log("Emitting event: ", event);
};

export const deleteFilesFromCloudinary = async (public_ids) => {};

export const uploadFilesToCloudinary = async (files = []) => {
    const uploadPromises = files.map((file) => {
        console.log(
            "HEYYYY AM File From upload Files To Cloudinary ===================\n\n",
            file,
            "\n",
            "==================== \n\n"
        );

        return new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                getBase64(file),
                // file.buffer,
                {
                    resource_type: "auto",
                    public_id: uuid(),
                    folder: "skapp",
                },
                (error, result) => {
                    if (error) return reject(error);

                    resolve(result);
                }
            );
        });
    });
    console.count("After new promise");
    try {
        const results = await Promise.all(uploadPromises);

        console.count("After results");

        const formattedResults = results.map((result) => ({
            public_id: result.public_id,
            url: result.secure_url,
        }));

        return formattedResults;
    } catch (error) {
        console.log("Error From Clodiany", error);
        throw new Error("error uploading files to cloudinary", error);
    }
};
