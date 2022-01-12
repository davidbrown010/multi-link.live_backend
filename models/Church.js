const mongoose = require('mongoose')

const ChurchSchema = mongoose.Schema({
    PCO_Id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    logoURL: String
})

module.exports = mongoose.model('Churches', ChurchSchema)