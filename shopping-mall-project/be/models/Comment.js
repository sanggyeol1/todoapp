const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    email: { type: String, required: true },
    content: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

commentSchema.methods.toJson = function () {
    const obj = this._doc;
    delete obj.__v;
    return obj;
};

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
