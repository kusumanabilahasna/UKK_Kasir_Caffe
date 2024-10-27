exports.IsKasir = async (request, response, next) => {
    if (request.user.role == "kasir") {
      next();
    } else {
      return response.status(401).json({
        success: false,
        auth: false,
        message: "forbidden, You Not User",
      });
    }
};
  
exports.IsAdmin = async (request, response, next) => {
    if (request.user.role == "admin") {
      next();
    } else {
      return response.status(401).json({
        success: false,
        auth: false,
        message: "forbidden, You Not Admin",
      });
    }
};

exports.IsManager = async (request, response, next) => {
    if (request.user.role == "manajer") {
      next();
    } else {
      return response.status(401).json({
        success: false,
        auth: false,
        message: "forbidden, You Not Manajer",
      });
    }
};