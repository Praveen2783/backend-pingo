import express from "express";
import "dotenv/config";
import connectDb from "./config/connectDb.js";
import authRoute from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/userRoutes.js";
import shopRoute from "./routes/shopRoutes.js";
import itemRoute from "./routes/itemRoutes.js";
import orderRoute from "./routes/orderRoutes.js";
import http from 'http'
import { Server } from "socket.io";
import { handleSocket } from "./socketIo.js";




const app = express();
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "https://frontend-pingo.vercel.app",
        credentials: true,
        methods:['POST','GET','DELETE']
    }
})

app.set("io",io)



const port = process.env.PORT || 8000;

app.use(cors({
    origin: "https://frontend-pingo.vercel.app",
    credentials: true,
}))
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

let isconnected = false;
app.use((req,res,next)=>{
 if(!isconnected){
    connectDb().then(()=>{
        isconnected = true;
        next();
    }).catch((err)=>{
        console.log("Error connecting to DB",err);
        res.status(500).send("Error connecting to DB");
    })
    }else{
        next();
    }
})




app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/shop', shopRoute);
app.use('/api/item', itemRoute);
app.use('/api/order', orderRoute);

handleSocket(io)
// server.listen(port, () => {
//   connectDb();
//     console.log(`server is running at port ${port}`);
// })
// export default server
