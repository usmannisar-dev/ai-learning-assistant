// ========================================
// GLOBAL ERROR HANDLER
// ========================================
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // ========================================
  // MONGOOSE BAD OBJECT ID
  // ========================================
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource Not Found";
  }

  // ========================================
  // MONGOOSE DUPLICATE KEY
  // ========================================
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];

    statusCode = 400;
    message = `${field || "Field"} Already Exists`;
  }

  // ========================================
  // MONGOOSE VALIDATION ERROR
  // ========================================
  if (err.name === "ValidationError") {
    statusCode = 400;

    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  // ========================================
  // MULTER FILE SIZE ERROR
  // ========================================
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File Size Exceeds The Maximum Limit Of 10MB";
  }

  // ========================================
  // JWT INVALID TOKEN
  // ========================================
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid Token";
  }

  // ========================================
  // JWT TOKEN EXPIRED
  // ========================================
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token Expired";
  }

  // ========================================
  // LOG ERROR
  // ========================================
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // ========================================
  // RESPONSE
  // ========================================
  const response = {
    success: false,
    error: message,
    statusCode,
  };

  // Only show stack in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
