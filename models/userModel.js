import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
    },
    mobileNumber: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'owner', 'deliveryBoy'],
        default: 'user',
        required: true
    },
    resetOtp: {
        type: String,
    },
    otpExpiryTime: {
        type: Date,
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    socketId: {
        type: String,
    },
    isOnline: {
        type: Boolean,
        default: false
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }

}, { timestamps: true })

userSchema.index({ location: "2dsphere" })

const UserModel = mongoose.model.User || mongoose.model('User', userSchema)

export default UserModel