const { populate } = require("dotenv")
const Cart = require("../models/Cart")

const cartController = {}

cartController.addItemToCart = async (req, res) => {
    try {
        const { userId } = req
        const { productId, size, qty } = req.body
        //유저를 가지고 카트 찾기
        let cart = await Cart.findOne({ userId })
        if (!cart) {
            //유저가 만든 카트가 없다? 만들어주기
            cart = new Cart({ userId })
            await cart.save()
        }
        //이미 카트에들어가있는 아이템인가? productId, size
        const existItem = cart.items.find(
            (item) => item.productId.equals(productId) && item.size === size
        )
        if (existItem) {
            //그렇다면 에러('이미 카트에 아이템이 있습니다.')
            throw new Error("아이템이 이미 카트에 있습니다.")
        }
        //카트에 아이템을 추가
        cart.items = [...cart.items, { productId, size, qty }]
        await cart.save()
        res.status(200).json({ status: "success", data: cart, cartItemQty: cart.items.length })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err.message })
    }
}

cartController.getCart = async (req, res) => {
    try {
        const { userId } = req
        const cart = await Cart.findOne({ userId }).populate({//외래키로가져오기
            path: "items",
            populate: {
                path: "productId",
                model: "Product"
            }
        })
        res.status(200).json({ status: "success", data: cart.items })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err.message })
    }
}


cartController.deleteCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req;
        const cart = await Cart.findOne({ userId });
        cart.items = cart.items.filter((item) => !item._id.equals(id));

        await cart.save();
        res.status(200).json({ status: 200, cartItemQty: cart.items.length });
    } catch (error) {
        return res.status(400).json({ status: "fail", error: error.message });
    }
};

cartController.editCartItem = async (req, res) => {
    try {
        const { userId } = req;
        const { id } = req.params;

        const { qty } = req.body;
        const cart = await Cart.findOne({ userId }).populate({
            path: "items",
            populate: {
                path: "productId",
                model: "Product",
            },
        });
        if (!cart) throw new Error("There is no cart for this user");
        const index = cart.items.findIndex((item) => item._id.equals(id));
        if (index === -1) throw new Error("Can not find item");
        cart.items[index].qty = qty;
        await cart.save();
        res.status(200).json({ status: 200, data: cart.items });
    } catch (error) {
        return res.status(400).json({ status: "fail", error: error.message });
    }
};

cartController.getCartQty = async (req, res) => {
    try {
        const { userId } = req;
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) throw new Error("There is no cart!");
        res.status(200).json({ status: 200, qty: cart.items.length });
    } catch (error) {
        return res.status(400).json({ status: "fail", error: error.message });
    }
};

module.exports = cartController