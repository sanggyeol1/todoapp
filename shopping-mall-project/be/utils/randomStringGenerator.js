const randonStringGenerator = () => {
    const randonString = Array.from(Array(10), () =>
        Math.floor(Math.random() * 36).toString(36)
    ).join("")

    return randonString
}//orderNumber 만들 때 사용

module.exports = {randonStringGenerator}