import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    const token = authHeader.split(" ")[1]; // More reliable than `.replace("Bearer ", "")`
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found, token is invalid" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    let message = "Token is not valid";
    if (error.name === "TokenExpiredError") {
      message = "Token has expired, please log in again";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token, authentication failed";
    }

    res.status(401).json({ message });
  }
};

export default protectRoute;
