import jwt from "jsonwebtoken";

function generateToken(payload: string | object | Buffer) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: +process.env.JWT_TOKEN_MAX_AGE!,
  });
}

export default generateToken;
