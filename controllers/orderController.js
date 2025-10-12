import { model } from "mongoose";
import deliveryAssignmentModel from "../models/deliveryAssignmentModel.js";
import ItemModel from "../models/itemModel.js";
import OrderModel from "../models/orderModel.js";
import ShopModel from "../models/shopModel.js";
import UserModel from "../models/userModel.js";
import { sendDeliveryOTPMail, sendOTPMail } from "../config/mail.js";
import Razorpay from 'razorpay'



let instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body
        if (cartItems === 0 || !cartItems) return res.json({ success: false, message: "cartItems Empty!" })

        if (!deliveryAddress.text || !deliveryAddress.longitude || !deliveryAddress.latitude) return res.json({ success: false, message: "deliveryAddress is required!" })

        const groupItemsByShop = {}

        cartItems.forEach(item => {

            const shopId = item.shop
            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = []
            }
            groupItemsByShop[shopId].push(item)

        });

        const shopOrder = await Promise.all(Object.keys(groupItemsByShop).map(async (shopId) => {
            const shop = await ShopModel.findById(shopId).populate('owner')
            if (!shop) return res.json({ success: false, message: "shop not found!" })

            const items = groupItemsByShop[shopId]
            const subTotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
            return {
                shop: shop._id,
                owner: shop.owner._id,
                subTotal,
                shopOrderItems: items.map(i => ({
                    item: i._id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name

                }))

            }



        }))

        if (paymentMethod === "online") {
            const razorpayOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `receipt${Date.now()}`
            })
            const newOrder = await OrderModel.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders: shopOrder,
                razorpayOrderId: razorpayOrder.id,
                payment: false
            })
            return res.json({
                success: true,
                razorpayOrder,
                orderId: newOrder._id,
                key_id: process.env.RAZORPAY_KEY_ID
            })
        }

        const newOrder = await OrderModel.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders: shopOrder
        })


        await newOrder.populate("shopOrders.shop", "name")
        await newOrder.populate("shopOrders.deliveryBoyAssigned")
        await newOrder.populate("user")
        await newOrder.populate("shopOrders.owner")
        await newOrder.populate("shopOrders.shopOrderItems.item",)

        const io = req.app.get('io')

        if (io) {
            newOrder.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder?.owner?.socketId

                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: newOrder._id,
                        paymentMethod: newOrder.paymentMethod,
                        user: newOrder.user,
                        deliveryAddress: newOrder.deliveryAddress,
                        shopOrders: shopOrder,
                        createdAt: newOrder.createdAt,
                        payment: newOrder.payment
                    })
                }
            })
        }


        return res.json({ success: true, newOrder, message: "Order placed successfully!" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_PaymentId, orderId, } = req.body

        const payment = await instance.payments.fetch(razorpay_PaymentId);
        if (!payment || payment.status !== 'captured') {
            return res.json({ success: false, message: "payment failed! Try again" })
        }
        const order = await OrderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "order not found!" })
        }
        order.payment = true
        order.razorpayPaymentId = razorpay_PaymentId
        await order.save()



        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.deliveryBoyAssigned")
        await order.populate("user")
        await order.populate("shopOrders.owner")
        await order.populate("shopOrders.shopOrderItems.item",)

        const io = req.app.get('io')

        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder?.owner?.socketId

                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        deliveryAddress: order.deliveryAddress,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        payment: order.payment
                    })
                }
            })
        }


        return res.json({ success: true, order })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const getMyOrders = async (req, res) => {
    try {

        const user = await UserModel.findById(req.userId);
        if (user.role === "user") {
            const orders = await OrderModel.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobileNumber")
                .populate("shopOrders.shopOrderItems.item",)
            if (!orders) return res.json({ success: false, message: "orders not found!" })

            res.json({ success: true, orders })
        } else if (user.role === "owner") {
            const orders = await OrderModel.find({ "shopOrders.owner": req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.deliveryBoyAssigned")
                .populate("user")
                .populate("shopOrders.shopOrderItems.item",)


            if (!orders) return res.json({ success: false, message: "orders not found!" })


            const filterOrders = orders.map((order) => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                deliveryAddress: order.deliveryAddress,
                shopOrders: order.shopOrders.find(o => o.owner._id == req.userId),
                createdAt: order.createdAt,
                payment: order.payment

            }))


            res.json({ success: true, filterOrders })

        }




    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params
        const { status } = req.body;
        // console.log(status)
        const order = await OrderModel.findById(orderId);

        const shopOrder = order.shopOrders.find(o => o.shop == shopId)
        if (!shopOrder) return res.json({ success: false, message: "shop orders not found!" })

        shopOrder.status = status;
        let getdeliveryBoys = []
        if (status === "Out of delivery" || !shopOrder.deliveryAssignment) {
            const { longitude, latitude } = order.deliveryAddress
            const nearByDeliveryboys = await UserModel.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [Number(longitude), Number(latitude)]
                        },
                        $maxDistance: 20000
                    }
                }
            })

            const nearByIds = nearByDeliveryboys.map(db => db._id)
            const NotAssignedIds = await deliveryAssignmentModel.find({
                assignedTo: {
                    $in: nearByIds
                },
                status: { $nin: ["broadcasted", "completed"] }


            }).distinct("assignedTo")

            const NotAssignedIdsSet = new Set(NotAssignedIds.map(id => String(id)))

            const availableDeliveryBoy = nearByDeliveryboys.filter(db => !NotAssignedIdsSet.has(String(db._id)))

            const availableDeliveryBoyIds = availableDeliveryBoy.map(adb => adb._id)
            if (availableDeliveryBoyIds.length === 0) {
                await shopOrder.save();
                await order.save();
                return res.json({ success: false, message: "No available delivery boys!" })
            }

            const CreateDeliveryAssignment = await deliveryAssignmentModel.create({
                order: order._id,
                shop: shopOrder.shop,
                shopOrderId: shopOrder._id,
                broadCastedTo: availableDeliveryBoyIds,
                status: "broadcasted"
            })

            shopOrder.deliveryBoyAssigned = CreateDeliveryAssignment.assignedTo;
            shopOrder.deliveryAssignment = CreateDeliveryAssignment._id;
            getdeliveryBoys = availableDeliveryBoy.map(db => ({
                _id: db._id,
                fullName: db.fullName,
                longitude: db.location.coordinates[0],
                latitude: db.location.coordinates[1],
                mobileNumber: db.mobileNumber
            }))
            await CreateDeliveryAssignment.populate('order')
            await CreateDeliveryAssignment.populate('shop')

            const io = req.app.get('io')
            if (io) {
                availableDeliveryBoy.forEach(db => {
                    const deliveryBoySocketId = db.socketId
                    if (deliveryBoySocketId) {
                        io.to(deliveryBoySocketId).emit('newAssigment', {
                            deliveryboyId:db._id ,
                            assignmentId: CreateDeliveryAssignment._id,
                            orderId: CreateDeliveryAssignment.order._id,
                            shopName: CreateDeliveryAssignment.shop.name,
                            deliveryAddress: CreateDeliveryAssignment.order.deliveryAddress,
                            items: CreateDeliveryAssignment.order.shopOrders.find(so => so._id.equals(CreateDeliveryAssignment.shopOrderId))?.shopOrderItems || [],
                            subTotal: CreateDeliveryAssignment.order.shopOrders.find(so => so._id.equals(CreateDeliveryAssignment.shopOrderId))?.subTotal
                        })
                    }
                })
            }


        }

        await shopOrder.save();
        await order.save();
        const updatedShopOrder = order.shopOrders.find(o => o.shop == shopId)
        await order.populate("shopOrders.shop", " name ")
        await order.populate("shopOrders.deliveryBoyAssigned", " fullName email mobileNumber")
        await order.populate("user")



        const io = req.app.get('io')
        if (io) {
            const userSocketId = order.user.socketId
            if (userSocketId) {
                io.to(userSocketId).emit('updateStatus', {
                    orderId: order._id,
                    shopId: updatedShopOrder.shop._id,
                    status: updatedShopOrder.status,
                    userId: order.user._id
                })
            }

        }


        return res.json({
            success: true, shopOrder: updatedShopOrder,
            deliveryBoyAssigned: updatedShopOrder?.deliveryBoyAssigned,
            availableDeliveryBoys: getdeliveryBoys,
            deliveryAssignment: updatedShopOrder?.deliveryAssignment._id,

            message: "orders status change successfully!"
        })


    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        let deliveryAssignment = await deliveryAssignmentModel.find({
            broadCastedTo: req.userId,
            status: "broadcasted",

        }).populate("order")
            .populate("shop")
        const deliveryAssignments = deliveryAssignment.map(da => ({
            assignmentId: da._id,
            orderId: da.order._id,
            shopName: da.shop.name,
            deliveryAddress: da.order.deliveryAddress,
            items: da.order.shopOrders.find(so => so._id.equals(da.shopOrderId))?.shopOrderItems || [],
            subTotal: da.order.shopOrders.find(so => so._id.equals(da.shopOrderId))?.subTotal
        }))

        return res.json({
            success: true,
            deliveryAssignments,
            // deliveryAssignment,
            message: "orders status change successfully!"
        })
    } catch (error) {
        return res.json({ success: false, message: error.message })

    }
}


export const acceptDeliveryAssignment = async (req, res) => {
    try {

        const { assignmentId } = req.params
        console.log(req.userId)
        const deliveryAssignment = await deliveryAssignmentModel.findById(assignmentId);
        if (!deliveryAssignment) return res.json({ success: false, message: "deliveryAssignment not found!" });
        if (deliveryAssignment.status !== "broadcasted") {
            return res.json({ success: false, message: "deliveryAssignment is expired!" });
        }

        const alreadyAssigned = await deliveryAssignmentModel.findOne({
            assignedTo: req.userId,
            status: { $nin: ["broadcasted", "completed"] }
        })
        if (alreadyAssigned) {
            return res.json({ success: false, message: "yor are already assigned to other deliveryAssignment!" });
        }


        deliveryAssignment.assignedTo = req.userId;
        deliveryAssignment.status = "assigned";

        deliveryAssignment.acceptedAt = new Date()

        await deliveryAssignment.save();


        const order = await OrderModel.findById(deliveryAssignment.order)
        if (!order) return res.json({ success: false, message: "order not found!" });
        const shopOrder = order.shopOrders.id(deliveryAssignment.shopOrderId);

        shopOrder.deliveryBoyAssigned = req.userId
        await shopOrder.save();
        await order.save();
        return res.json({ success: true, deliveryAssignment, message: " deliveryAssignment accepted!" });
    } catch (error) {
        return res.json({ success: false, message: error.message })

    }
}


export const getCurrDeliveryAssigment = async (req, res) => {
    try {
        const currDeliveryAssignment = await deliveryAssignmentModel.findOne({
            assignedTo: req.userId,
            status: "assigned"
        }).populate("shop", "name")
            .populate("assignedTo", "fullName email mobileNumber  location ")
            .populate({
                path: "order",
                populate: [{
                    path: "user",
                    select: "fullName email mobileNumber  location "
                }]
            })

        if (!currDeliveryAssignment) return res.json({ success: false, message: "currDeliveryAssignment not found!" });
        if (!currDeliveryAssignment.order) return res.json({ success: false, message: "order not found!" });
        const shopOrder = currDeliveryAssignment.order.shopOrders.find(so => String(so._id) == String(currDeliveryAssignment.shopOrderId));
        if (!shopOrder) return res.json({ success: false, message: "shop order not found!" });


        let deliveryBoyLocation = { lat: null, lon: null }
        if (currDeliveryAssignment.assignedTo.location.coordinates.length == 2) {
            deliveryBoyLocation.lat = currDeliveryAssignment.assignedTo.location.coordinates[1]
            deliveryBoyLocation.lon = currDeliveryAssignment.assignedTo.location.coordinates[0]
        }
        let customerLocation = { lat: null, lon: null }
        if (currDeliveryAssignment.order.deliveryAddress) {
            customerLocation.lat = currDeliveryAssignment.order.deliveryAddress.latitude;
            customerLocation.lon = currDeliveryAssignment.order.deliveryAddress.longitude;
        }




        res.json({ success: true, currDeliveryAssignment, _id: currDeliveryAssignment.order._id, user: currDeliveryAssignment.order.user, shopOrder, shop: currDeliveryAssignment.shop, deliveryBoyLocation, customerLocation, deliveryAddress: currDeliveryAssignment.order.deliveryAddress.text })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const getOrderById = async (req, res) => {
    const { orderId } = req.params
    try {
        const order = await OrderModel.findById(orderId)
            .populate("user")
            .populate({
                path: "shopOrders.shop",
                model: "Shop"
            })
            .populate({
                path: "shopOrders.deliveryBoyAssigned",
                model: "User"
            })
            .populate({
                path: "shopOrders.shopOrderItems.item",
                model: "Item"
            }).lean()
        if (!order) {
            return res.json({ success: false, message: "Order not Found!" })
        }
        return res.json({ success: true, order })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        const order = await OrderModel.findById(orderId).populate("user");
        const shopOrder = await order.shopOrders.id(shopOrderId);
        if (!order || !shopOrder) {
            return res.json({ success: false, message: "Order not Found!" })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        shopOrder.deliveryOtp = otp;
        shopOrder.otpExpiryTime = Date.now() + 5 * 60 * 1000
        await order.save();

        await sendDeliveryOTPMail(order.user.email, otp)
        return res.json({ success: true, message: "Delivery OTP successfully sent to your email!" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body
        const order = await OrderModel.findById(orderId);
        const shopOrder = await order.shopOrders.id(shopOrderId);
        if (!order || !shopOrder) {
            return res.json({ success: false, message: "Order not Found!" })
        }
        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpiryTime || shopOrder.otpExpiryTime < Date.now()) {
            return res.json({ success: false, message: "Invalid/Expired OTP!" })
        }

        shopOrder.status = 'Delivered'
        shopOrder.deliveredAt = Date.now();
        await order.save()

        await deliveryAssignmentModel.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.deliveryBoyAssigned
        })

        return res.json({ success: true, message: "DeliveryBoy delivered the food successfully! " })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
} 




export const getTodaysDeliveries = async (req, res) => {
    try {
      const  deliveryId = req.userId
   
      const statsOfDay = new Date();
      statsOfDay.setHours(0,0,0,0)
      const  orders = await OrderModel.find({
        "shopOrders.deliveryBoyAssigned":deliveryId,
        "shopOrders.status": "Delivered",
        "shopOrders.deliveredAt":{  $gte: statsOfDay }
      }).lean()
    
      if(!orders) return res.json({success:false, message:"No orders found!"});
      let todaysDeliveries =[]
       orders.forEach(order =>{
          order.shopOrders.forEach(shopOrder =>{
            if(shopOrder.deliveryBoyAssigned == deliveryId && shopOrder.status === "Delivered" && shopOrder.deliveredAt >= statsOfDay){
                todaysDeliveries.push(shopOrder) 
            }
          })
      })

     let stats ={} 
          todaysDeliveries.forEach(shopOrder =>{
            const hour = new Date(shopOrder.deliveredAt).getHours();
            stats[hour] = (stats[hour] || 0) + 1;

          })
      let formatedStats = Object.keys(stats).map(hour =>({
        hour: parseInt(hour),
        count:stats[hour]
      }))
      
      formatedStats.sort((a,b)=> a.hour - b.hour)

        return res.json({success:true, stats: formatedStats, })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
} 

