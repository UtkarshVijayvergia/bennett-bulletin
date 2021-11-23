const mongoose = require('mongoose');

const postschema = new mongoose.Schema({
    Author: {
        type: String,
        required: true
    },

    Title: {
        type: String,
        required: true
    },

    Content: {
        type: String,
        required: true
    },

    PostedAt: {
        type: Date,
        default: Date.now
    }
})


const amaan_posts = mongoose.model('amaan_posts', postschema);

module.exports = amaan_posts;