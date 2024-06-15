const Comment = require("../models/Comment");
const User = require("../models/User");
const commentController = {};

// 댓글 추가
commentController.addComment = async (req, res) => {
    try {
        if (!req.userId) {
            throw new Error("User not authenticated")
        }

        const { content, productId } = req.body
        const userId = req.userId

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const comment = new Comment({
            userId, 
            productId,
            email: user.email,
            content
        });

        await comment.save();
        res.status(201).json(comment.toJson())
    } catch (error) {
        console.error('Error adding comment:', error)
        res.status(500).json({ status: "fail", error: error.message })
    }
};

// 특정 제품의 댓글 조회
commentController.getCommentsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const comments = await Comment.find({ productId, isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json({ status: "success", data: comments.map(comment => comment.toJson()) });
    } catch (error) {
        res.status(500).json({ status: "fail", error: error.message });
    }
};

// 댓글 삭제
commentController.deleteComment = async (req, res) => {
    try {
        if (!req.userId) {
            throw new Error("User not authenticated");
        }

        const { id } = req.params;
        const userId = req.userId;

        const comment = await Comment.findOne({ _id: id, userId });

        if (!comment) {
            return res.status(404).json({ status: "fail", message: 'Comment not found or not authorized' });
        }

        comment.isDeleted = true;
        await comment.save();
        res.status(200).json({ status: "success", message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: "fail", error: error.message });
    }
};

module.exports = commentController;
