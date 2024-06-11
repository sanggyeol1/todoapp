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
    const cond = name ? { name: { $regex: name, $options: 'i' }, isDeleted: false }
      : { isDeleted: false }
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

productController.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id
    const { sku, name, size, image, price, description, category, stock, status } = req.body

    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { sku, name, size, image, price, description, category, stock, status },
      { new: true }
    )
    if (!product) throw new Error("item doesn't exist")
    res.status(200).json({ status: "success", data: product })
  } catch (err) {
    res.status(400).json({ status: "fail", error: err.message })
  }
}

productController.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      { isDeleted: true }
    );
    if (!product) throw new Error("No item found");
    res.status(200).json({ status: "success" });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) throw new Error("No item found");
    res.status(200).json({ status: "success", data: product });
  } catch (error) {
    return res.status(400).json({ status: "fail", error: error.message });
  }
};

productController.checkStock = async (item) => {
  //내가 사려는 아이템 재고 정보 들고오기
  const product = await Product.findById(item.productId)
  //내가 사려는 아이템 qty, 재고 비교
  if (product.stock[item.size] < item.qty) {
    //재고가 불출분하면 불충분 메세지와 함께 데이터 반환
    return { isVerify: false, message: `${product.name}의 ${item.size}재고가 부족합니다.` }
  }

  const newStock = { ...product.stock }
  newStock[item.size] -= item.qty
  product.stock = newStock

  await product.save()
  //충분하다면, 재고에서 -qty성공

  return { isVerify: true }
}

productController.checkItemListStock = async (itemList) => {
  const insufficientStockItems = [] //재고확인로직
  //재고확인로직
  await Promise.all(//await의 병렬처리
    itemList.map(async item => {
      const stockCheck = await productController.checkStock(item)
      if (!stockCheck.isVerify) {
        insufficientStockItems.push({ item, message: stockCheck.message })
      }
      return stockCheck
    }))

  return insufficientStockItems
}



module.exports = productController