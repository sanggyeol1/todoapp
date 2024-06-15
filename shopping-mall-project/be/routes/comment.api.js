const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller"); // 로그인 확인
const commentController = require("../controllers/comment.controller");

// 댓글 추가
router.post("/", authController.authenticate, commentController.addComment);

// 특정 제품의 댓글 조회
router.get("/product/:productId", commentController.getCommentsByProduct);

// 댓글 삭제
router.delete("/:id", authController.authenticate, commentController.deleteComment);

module.exports = router;
