const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    uuid: {
        required: true,
        type: String
    }
})

module.exports = mongoose.model('Instance', dataSchema)