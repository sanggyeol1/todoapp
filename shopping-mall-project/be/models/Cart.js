const mongoose = require("mongoose")
const User = require("./User")
const Product = require("./Product")
const Schema = mongoose.Schema
const cartSchema = Schema({
    userId: { type: mongoose.ObjectId, ref: User },
    items: [{
        productId: { type: mongoose.ObjectId, ref: Product },
        size: { type: String, required: true },
        qty: { type: Number, default: 1 }
    }]
}, { timestamps: true })

cartSchema.methods.toJson = function () {
    const obj = this._doc
    delete obj.password
    delete obj.__v
    delete obj.createAt
    return obj
}

const Cart = mongoose.model("cart", cartSchema);
module.exports = Cart;
