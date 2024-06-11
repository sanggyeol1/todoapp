const orderController = {}
const { randonStringGenerator } = require("../utils/randomStringGenerator")
const Order = require("../models/Order")
const productController = require("./product.controller")



orderController.createOrder = async (req, res) => {
    try {
        const { userId } = req
        const { shipTo, contact, totalPrice, orderList } = req.body

        //재고확인, 재고 업데이트
        const insufficientStockItems = await productController.checkItemListStock(orderList)

        //재고가 충분하지 않은 아이템이 있었다 => 에러
        if (insufficientStockItems.length > 0) {
            const errorMessage = insufficientStockItems.reduce((total, item) => total += item.message, "")
            throw new Error(errorMessage)
        }

        //오더를 만들자!
        const newOrder = new Order({
            userId,
            totalPrice,
            shipTo,
            contact,
            items: orderList,
            orderNum: randonStringGenerator()
        })

        await newOrder.save()

        res.status(200).json({ status: 'success', orderNum: newOrder.orderNum })
    } catch (err) {
        return res.status(400).json({ status: 'fail', error: err.message })
    }
}

module.exports = orderController