const mongoose = require('mongoose');

const CurrentZone = mongoose.Schema({
    name: String,
});

module.exports = mongoose.model("currentZone", CurrentZone);