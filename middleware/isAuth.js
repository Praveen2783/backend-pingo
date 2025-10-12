import jwt from "jsonwebtoken"
const  isAuth = async (req ,res,next)=>{
    try {
        const token = req.cookies.token
        
        if(!token){
            return res.json({success:false,message:"token not found!"})
        }
        const verifyToken = await jwt.verify(token,process.env.JWT_SECRET)
     

        req.userId =verifyToken.id
        next()
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export  default isAuth