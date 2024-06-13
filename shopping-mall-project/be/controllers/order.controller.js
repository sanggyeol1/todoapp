const orderController = {}
const { randonStringGenerator } = require("../utils/randomStringGenerator")
const Order = require("../models/Order")
const productController = require("./product.controller")
const PAGE_SIZE = 5


orderController.createOrder = async (req, res) => {
    try {
        const { userId } = req
        const { shipTo, contact, totalPrice, orderList, email } = req.body

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
            orderNum: randonStringGenerator(),
            email
        })
        

        await newOrder.save()

        res.status(200).json({ status: 'success', orderNum: newOrder.orderNum })
    } catch (err) {
        return res.status(400).json({ status: 'fail', error: err.message })
    }
}


orderController.getOrder = async(req, res) =>{
    try {
        const { userId } = req
        const order = await Order.find({ userId }).populate({//외래키로가져오기
            path: "items",
            populate: {
                path: "productId",
                model: "Product"
            }
        })
        res.status(200).json({ status: "success", data: order })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err.message })
    }
}

orderController.getOrderList = async (req, res, next) => {
    try {
      const { userId } = req
      const { page, ordernum } = req.query;
  
      let cond = { userId: userId };
      if (ordernum) {
        cond = {
          userId: userId,
          orderNum: { $regex: ordernum, $options: "i" },
        };
      }
  
      const orderList = await Order.find(cond)
        .populate("userId")
        .populate({
          path: "items",
          populate: {
            path: "productId",
            model: "Product",
            select: "image name",
          },
        })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE);
      const totalItemNum = await Order.find(cond).count();
  
      const totalPageNum = Math.ceil(totalItemNum / PAGE_SIZE);
      res.status(200).json({ status: "success", data: orderList, totalPageNum });
    } catch (error) {
      return res.status(400).json({ status: "fail", error: error.message });
    }
  };





  

orderController.updateOrder = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await Order.findByIdAndUpdate(
        id,
        { status: status },
        { new: true }
      );
      if (!order) throw new Error("Can't find order");
  
      res.status(200).json({ status: "success", data: order });
    } catch (error) {
      return res.status(400).json({ status: "fail", error: error.message });
    }
  };



module.exports = orderController