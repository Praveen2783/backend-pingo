import connectCloudinary from "../config/cloudinary.js";
import ItemModel from "../models/itemModel.js";
import ShopModel from "../models/shopModel.js";

export const createShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;
        let image;
        if (req.file) {
            image = await connectCloudinary(req.file.path)
        }

        const shop = await ShopModel.create({
            name,
            city,
            state,
            address,
            image,
            owner: req.userId
        })
        await shop.populate("owner,items")
        return res.json({ success: true, message: "Shop created successfully!", shop })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const editShop = async (req, res) => {
    try {
        const { name, city, state, address } = req.body;
        let image;
        if (req.file) {
            image = await connectCloudinary(req.file.path)
        }

        let shop = await ShopModel.findOne({ owner: req.userId })
        shop = await ShopModel.findByIdAndUpdate(shop._id, {
            name,
            city,
            state,
            address,
            image,
            owner: req.userId
        }, { new: true })

        await shop.populate("owner")
        return res.json({ success: true, message: "Shop updated successfully!", shop })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const createItems = async (req, res) => {
    try {
        const { name, category, price, foodType, discount } = req.body;
        let image;
        if (req.file) {
            image = await connectCloudinary(req.file.path)
        }
        let shop = await ShopModel.findOne({ owner: req.userId }).populate("items")
        if (!shop) return res.json({ success: false, message: "Shop not found!" })
        const item = await ItemModel.create({
            name,
            category,
            price,
            foodType,
            image,
            discount,
            shop: shop._id
        })

        shop.items.push(item._id)
        await shop.save();


        return res.json({ success: true, message: "Shop updated successfully!", shop })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const editItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        const { name, category, price, foodType, discount } = req.body;
        let image;
        if (req.file) {
            image = await connectCloudinary(req.file.path)
        }

        const item = await ItemModel.findByIdAndUpdate(itemId, {
            name,
            category,
            price,
            foodType,
            discount,
            image,

        }, { new: true })
        if (!item) {
            res.json({ success: false, message: "Shop not updated!" })
        }
        return res.json({ success: true, message: "Shop updated successfully!", item })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId
        // console.log(itemId)
        const item = await ItemModel.findByIdAndDelete(itemId)
        if (!item) {
            return res.json({ success: false, message: "Item not delete!" })
        }
        const shop = await ShopModel.findOne({ owner: req.userId })
        shop.items.filter(i => i._id !== item._id)
        await shop.save();
        await shop.populate("items,owner")
        return res.json({ success: true, message: "Item deleted successfully!", shop })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}



export const getShop = async (req, res) => {
    try {
        const shop = await ShopModel.findOne({ owner: req.userId }).populate({
            path: "owner items",
            options: { sort: { updatedAt: -1 } }
        })
        if (!shop) return res.json({ success: false, message: "Shop not found!" })
        return res.json({ success: true, shop })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getShopsByCity = async (req, res) => {
    try {
        const { city } = req.params
        const shop = await ShopModel.find({ city: { $regex: new RegExp(`^${city}$`, "i") } }).populate("items")
        if (!shop) return res.json({ success: false, message: "Shop not found!" })
        return res.json({ success: true, shop })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const getitemsByCity = async (req, res) => {
    try {
        const { city } = req.params
        const shops = await ShopModel.find({ city: { $regex: new RegExp(`^${city}$`, "i") } }).populate("items")
        if (!shops) return res.json({ success: false, message: "Shop not found!" })

        const shopIds = shops.map((shop) => shop._id)
        const items = await ItemModel.find({ shop: { $in: shopIds } })
        if (!items) return res.json({ success: false, message: "items not found!" })
        return res.json({ success: true, items })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}



export const getitemsByShop = async (req, res) => {
    try {
        const { shopId } = req.params
        const shop = await ShopModel.findById(shopId).populate("items")
        if (!shop) return res.json({ success: false, message: "Shop not found!" })
        return res.json({ success: true, shop, items: shop.items })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const getSearchItems = async (req, res) => {
    try {
        const { query, city } = req.query
        if (!query || !city) {
            return res.json({ success: false, message: "Item not found!" })
        }
        const shops = await ShopModel.find({ city: { $regex: new RegExp(`^${city}$`, "i") } }).populate("items")
        if (!shops) return res.json({ success: false, message: "Shop not found!" })
        const shopIds = shops.map(s => s._id)
        const items = await ItemModel.find({
            shop: { $in: shopIds },
            $or: [
                {
                    name: { $regex: query, $options: "i" }
                },
                {
                    category: { $regex: query, $options: "i" }
                }
            ]
        }).populate("shop")

        return res.json({ success: true, items })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}



export const ratingItems = async (req, res) => {

    try {
        const { itemId, rating } = req.body
           
        if (!itemId || !rating) return res.json({ success: false, message: "Invalid Items!" })
        if (rating < 1 || rating > 5) return res.json({ success: false, message: "Rating must be between 1 and 5" })

        const item = await ItemModel?.findById(itemId)
    
        if (!item) return res.json({ success: false, message: " Item not found!" })
        const newCount = item.rating.count + 1
        const newAvg = ((item.rating.avg * item.rating.count) + rating) / newCount
        item.rating.count = newCount;
        item.rating.avg = newAvg;
        await item.save()
        return res.json({ success: true, rating: item.rating, message: "Rating added successfully!" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

