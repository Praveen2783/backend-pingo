import express from 'express';

import isAuth from '../middleware/isAuth.js';
import { createShop, editShop, getitemsByShop, getSearchItems, getShop, getShopsByCity } from '../controllers/shopController.js';
import upload from '../middleware/multer.js';



const shopRoute = express.Router();


shopRoute.post('/create',isAuth,upload.single("image"),createShop);
shopRoute.post('/edit',isAuth,upload.single("image"),editShop);
shopRoute.get('/get-my-shop',isAuth,getShop);
shopRoute.get('/get-shop-by-city/:city',isAuth,getShopsByCity);
shopRoute.get('/get-items-by-shop/:shopId',isAuth,getitemsByShop);
shopRoute.get('/get-search-items',isAuth,getSearchItems);

export default shopRoute;