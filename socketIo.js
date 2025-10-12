import UserModel from "./models/userModel.js"

export const handleSocket = (io) => {
    io.on('connection', (socket) => {
        // console.log(socket.id)
        socket.on('identity', async ({ userId }) => {
            try {
                const user = await UserModel.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    isOnline: true
                }, { new: true })
            } catch (error) {

                console.log(error)

            }
        })

        socket.on('updateLocation', async ({latitude, longitude, deliveryBoyId}) => {
            // console.log(latitude, longitude, deliveryBoyId)
            try {
                const user = await UserModel.findByIdAndUpdate(deliveryBoyId, {
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    isOnline: true,
                    socketId: socket.id
                })


                if (user) {
                    io.emit('deliveryBoyLocationUpdate', {
                        latitude, longitude,
                        deliveryBoyId
                    })
                }



            } catch (error) {
                console.log(error)
            }
        })

        socket.on('disconnect', async () => {
            try {
                await UserModel.findOneAndUpdate({ socketId: socket.id }, {
                    socketId: null,
                    isOnline: false
                }, { new: true })
            } catch (error) {

                console.log(error)

            }
        })

    })
}