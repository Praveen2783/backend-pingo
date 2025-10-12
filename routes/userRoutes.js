import express from 'express';
import { getCurrUser, updateProfile, updateUserLocation } from '../controllers/userController.js';
import isAuth from '../middleware/isAuth.js';



const userRoute = express.Router();


userRoute.get('/current',isAuth,getCurrUser);
userRoute.post('/update-location',isAuth,updateUserLocation);
userRoute.post('/update-profile',isAuth,updateProfile);

export default userRoute;