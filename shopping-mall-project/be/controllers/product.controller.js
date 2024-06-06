const { response } = require("express")
const Product = require("../models/Product")
const productController = {}
const PAGE_SIZE = 5

productController.createProduct = async (req, res) => {
    try {
        const { sku, name, size, image, category, description, price, stock, status } = req.body


        const product = new Product({
            sku, name, size, image, category, description, price, stock, status
        })

        await product.save()
        res.status(200).json({ status: "success", product })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err.message })
    }
}

productController.getProducts = async (req, res) => {
    try {
        const { page, name } = req.query
        const cond = name ? { name: { $regex: name, $options: 'i' } } : {}
        let query = Product.find(cond)//선언부

        if (page) {
            //페이지네이션
            query.skip(PAGE_SIZE * (page - 1)).limit(PAGE_SIZE)
            //최종 몇개의 페이지?
            //데이터가 총 몇개 있는지 확인
            const totalItemNum = await Product.find(cond).count()
            //데이터 총 갯수 / PAGE_SIZE
            const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE)
            response.totalPageNum = totalPageNum
        }

        const productList = await query.exec()//실행부
        response.data = productList
        res.status(200).json(response)
    } catch (err) {
        res.status(400).json({ status: "fail", error: err.message })
    }
}


module.exports = productController