import jwt from 'jsonwebtoken'
const genToken = async (userId)=>{
    const token = jwt.sign({id:userId},process.env.JWT_SECRET,{
        expiresIn:"7d"
    })
    return token    
}
export default genToken