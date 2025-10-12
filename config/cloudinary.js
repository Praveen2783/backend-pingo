import {v2 as cloudinary} from 'cloudinary'
import fs from "fs"
const connectCloudinary = async (file)=>{
    cloudinary.config({
        cloud_name:process.env.CLOUDINARY_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_SECRET_KEY
    });

    try {
        const uploadResult = await cloudinary.uploader.upload(file)
        fs.unlinkSync(file)
        return uploadResult.secure_url
    } catch (error) {
        fs.unlinkSync(file);
        return res.json({success:false,message:error.message});
        
    }
}
export default connectCloudinary