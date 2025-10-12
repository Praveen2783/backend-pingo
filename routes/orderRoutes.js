import express from 'express';

import isAuth from '../middleware/isAuth.js';


import { acceptDeliveryAssignment, getCurrDeliveryAssigment, getDeliveryBoyAssignment, getMyOrders,  getOrderById,  getTodaysDeliveries,  placeOrder, sendDeliveryOtp, updateOrderStatus, verifyDeliveryOtp, verifyPayment } from '../controllers/orderController.js';



const orderRoute = express.Router();

orderRoute.post("/create",isAuth,placeOrder)
orderRoute.post("/verify-payment",isAuth,verifyPayment)
orderRoute.get("/get-my-order",isAuth,getMyOrders)
orderRoute.post("/send-delivery-otp",isAuth,sendDeliveryOtp)
orderRoute.post("/verify-delivery-otp",isAuth,verifyDeliveryOtp)
orderRoute.get("/get-delivery-assignment",isAuth,getDeliveryBoyAssignment)
orderRoute.get("/get-curr-delivery-assignment",isAuth,getCurrDeliveryAssigment)
orderRoute.post("/update-status/:orderId/:shopId",isAuth,updateOrderStatus)
orderRoute.get("/accept-delivery-assignment/:assignmentId",isAuth,acceptDeliveryAssignment)
orderRoute.get("/get-order-by-id/:orderId",isAuth,getOrderById)
orderRoute.get("/get-todays-deliveries",isAuth,getTodaysDeliveries)




export default orderRoute;