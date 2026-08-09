const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
    console.log("authMiddleware 1");
    const token = req.cookies.AccessToken;
    console.log(token);
    // console.log(req.cookies);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token not found"
        })
    }
    console.log("authMiddleware 2");
    try {
        const decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log(decode);
        req.user = decode.id;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({
            success: false,
            message: "Token invalid"
        })
    }
}

module.exports = protect;