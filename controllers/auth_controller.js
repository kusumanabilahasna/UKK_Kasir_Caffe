const md5 = require(`md5`)
const jwt = require(`jsonwebtoken`)
const userModel = require(`../models/index`).user
const secret = "moklet";

const authenticate = async (request, response) => {
    let dataLogin = {
        username: request.body.username,
        password: md5(request.body.password)
    }

    let dataUser = await userModel.findOne({ 
        where: dataLogin
    })

    if(dataUser){
        let payload = JSON.stringify(dataUser)
        console.log(payload);
        let token = jwt.sign(payload, secret)
        return response.json({
            success: true,
            logged: true,
            message: `Authentication Successed`,
            token: token,
            data: dataUser
        });
    }
    return response.json({
        success: false,
        logged: false,
        message: `Authentication Failed. Invalid username or password`
    })
}

const authorize = (request, response, next) => {
    let authHeader = request.headers.authorization
    
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        let verivedUser;
        try {
          verivedUser = jwt.verify(token, secret);
        } catch (error) {
          if (error instanceof jwt.TokenExpiredError) {
            return response.status(400).json({
              message: "token expired",
              err: error,
            });
          }
          return response.status(400).json({
            message: "Auth Invalid",
            err: error,
          });
        }
        request.user = verivedUser;
        next();
      } else {
        return response.json({
          success: false,
          auth: false,
          message: "User Unauthorize",
        });
      }
}

module.exports = {authenticate, authorize}