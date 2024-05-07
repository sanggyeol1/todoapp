const { MongoClient } = require("mongodb")

const url = process.env.DB_URL;
let connectDB = new MongoClient(url).connect()

module.exports = connectDB //db변수가 완성되기까지 오래 걸려서 이것만 exports