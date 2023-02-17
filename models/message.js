const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    phone: {
        required: true,
        type: String
    },
    message: {
        required: true,
        type: String
    }
})

module.exports = mongoose.model('Message', dataSchema)