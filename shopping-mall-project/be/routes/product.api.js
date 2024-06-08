const express = require("express")
const authController = require("../controllers/auth.controller")
const productController = require("../controllers/product.controller")
const router = express.Router()

//상품추가
router.post(
    '/',
    authController.authenticate,
    authController.checkAdminPermission,
    productController.createProduct
)

//상품불러오기
router.get("/", productController.getProducts)

//상품수정
router.put(
    '/:id',
    authController.authenticate,
    authController.checkAdminPermission,
    productController.updateProduct
)

//상품 삭제
router.delete(
    "/:id",
    authController.authenticate,
    authController.checkAdminPermission,
    productController.deleteProduct
);


router.get("/:id", productController.getProductById);

module.exports = router