const mongoose = require("mongoose")
const Schema = mongoose.Schema
const orderSchema = Schema({
    shipTo: { type: String, required: true },
    contact: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    userId: { type: mongoose.ObjectId, ref: User },
    status: { type: String, required: true },
    items: [{
        productId: { type: mongoose.ObjectId, ref: Product },
        size: { type: String, required: true },
        qty: { type: Number, default: 1 },
        price: { type: Number, required: true }
    }]
}, { timestamps: true })

orderSchema.methods.toJson = function () {
    const obj = this._doc
    delete obj.password
    delete obj.__v
    delete obj.createAt
    return obj
}

const Order = mongoose.model("order", orderSchema);
module.exports = Order;
