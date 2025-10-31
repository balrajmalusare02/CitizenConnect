import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(password, hashed);
};

export const generateToken = (id: number, role: string): string => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ id, role }, secret, { expiresIn: "7d" });
};

export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret);
};
