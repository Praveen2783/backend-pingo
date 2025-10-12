import mongoose from "mongoose";

const shopOrderItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },
    name: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },

}, { timestamps: true })


const shopOrderSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subTotal: {
        type: Number,
        required: true
    },

    shopOrderItems: [
        shopOrderItemSchema
    ],
    status: {
        type: String,
        enum: ["Pending", "Preparing", "Out of delivery","Delivered"],
        default: "Pending"
    },
    deliveryAssignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryAssignment",
        default: null
    },
    deliveryBoyAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

       deliveryOtp:{
        type:String,
        default:null
    },
    otpExpiryTime:{
        type:Date,
        default:null
    },
    deliveredAt:{
         type:Date,
        default:null 
    }
  

}, { timestamps: true })


const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ["cod", "online"],
        required: true
    },

    deliveryAddress: {
        text: String,
        longitude: Number,
        latitude: Number,
        // required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    shopOrders: [shopOrderSchema],
    payment:{
        type:Boolean,
        default:false
    },
    razorpayOrderId:{
        type:String,
        default:""
    },
    razorpayPaymentId:{
        type:String,
         default:""
    }

}, { timestamps: true })

const OrderModel = mongoose.model.Order || mongoose.model('Order', orderSchema)

export default OrderModel