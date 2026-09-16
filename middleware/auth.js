import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    let token;

    // CHECK IF TOKEN EXISTS IN AUTHORIZATION HEADER
    const authorization = req.headers.authorization;

    if (authorization && authorization.startsWith("Bearer ")) {
      token = authorization.split(" ")[1];
    }

    // TOKEN NOT PROVIDED
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized. Token is required.",
        statusCode: 401,
      });
    }

    // VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIND USER
    const user = await User.findById(decoded.id);

    // USER DOES NOT EXIST
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User belonging to this token no longer exists.",
        statusCode: 401,
      });
    }

    // ATTACH USER TO REQUEST
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    // TOKEN EXPIRED
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired.",
        statusCode: 401,
      });
    }

    // INVALID JWT
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token.",
        statusCode: 401,
      });
    }

    // OTHER ERRORS
    next(error);
  }
};

export default protect;
