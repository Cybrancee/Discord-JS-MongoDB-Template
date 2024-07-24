const { model, Schema } = require('mongoose');

let devPermission = new Schema({
    DevId: String,
    Permission: String,
});

module.exports = model("Developer", devPermission);