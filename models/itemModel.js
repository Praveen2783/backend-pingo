import mongoose  from "mongoose";

const itemSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    shop:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Shop",
        required:true
    },
    image:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:["Snacks","Main Course","Desserts","Pizza","Burgers","Sandwiches","South Indian","North Indian","Chinese","Fast Food", "Biryani" ,"Others"],
        required:true
    },
    price:{
        type:Number,
        min:0,
        required:true
    },
    foodType:{
        type:String,
        enum:["Veg","Non Veg"],
        required:true
    },

    discount:{
        type:Number,
        required:true 
    },
    rating:{
      avg:{  type:Number,default:0},
      count:{
        type:Number,
        default:0
      }

        
    }

   
},{timestamps:true})
const ItemModel = mongoose.model.Item || mongoose.model('Item',itemSchema)

export default  ItemModel