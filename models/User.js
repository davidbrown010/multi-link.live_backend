const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    userPCO_Id: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    birthdate: Date,
    profilePhotoURL: {
        type: String,
        default: 'cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    },
    profilePhotoURLThumbnail: {
        type: String,
        default: 'cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    },
    churchId: {
        type: String,
        required: true
    },
    permissionLevel: {
        type: String,
        required: true
    },
    manualConnection: {
        type: Boolean,
        default: false
    },
    darkMode: {
        type: Boolean,
        default: false
    },
    recentPlan: {
        type: String,
        default: null
    },
    defaultRoom: {
        type: String,
        default: null
    },
    defaultServiceType: {
        type: String,
        default: null
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Users", UserSchema)