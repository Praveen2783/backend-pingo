
import UserModel from "../models/userModel.js"

export const getCurrUser = async (req, res) => {
    const userId = req.userId
    try {
        
        const user = await UserModel.findById(userId).select("-password");
        if (!user) return res.json({ success: false, message: "User does not exist" })
       return res.json({ success:true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const updateUserLocation = async (req, res) => {
    
    try {
        const {lat, lon} =req.body
        
        const user = await UserModel.findByIdAndUpdate(req.userId,{
            location:{
                type:"Point",
                coordinates:[lon,lat],
            }
        },{new:true});
        if (!user) return res.json({ success: false, message: "User does not exist" })
        
            

       return res.json({ success:true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const updateProfile = async (req, res) => {
    
    try {
        const {fullName, email, mobileNumber} =req.body
        const user = await UserModel.findByIdAndUpdate(req.userId,{
            fullName,email,mobileNumber
        },{new:true});
        if(!user) return res.json({success:false,message:"User Not found!"})
        return res.json({success:true,user})    
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}





