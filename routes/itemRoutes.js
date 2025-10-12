import express from 'express';

import isAuth from '../middleware/isAuth.js';
import { createItems, deleteItem, editItem, getitemsByCity, ratingItems } from '../controllers/shopController.js';
import upload from '../middleware/multer.js';



const itemRoute = express.Router();


itemRoute.post('/create',isAuth,upload.single("image"),createItems);
itemRoute.post('/rating',isAuth,ratingItems);
itemRoute.post('/edit/:itemId',isAuth,upload.single("image"),editItem);
itemRoute.delete('/delete/:itemId',isAuth,deleteItem);
itemRoute.get('/get-by-city/:city',isAuth,getitemsByCity);

export default itemRoute;