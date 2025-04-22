import jwt, { JwtPayload } from "jsonwebtoken";
import { NextResponse } from "next/server";
import * as cookie from "cookie";

const secretKey = process.env.SECRETKEY;

const JWT_EXPIRATION = "2h"; // Token expiration time

export const setToken = (res: NextResponse, token: string) => {
  const serialized = cookie.serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Ensure cookie is only sent over HTTPS
    maxAge: 60 * 60, // 1 hour expiration
    path: "/", // Available on all routes
    sameSite: "strict", // Protection against CSRF
  });

  res.headers.set("Set-Cookie", serialized);
};

export const getToken = (req: Request) => {
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  return cookies.token || null;
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    if (!secretKey) {
      throw new Error("JWT-SECRET is not defined");
    }

    const decodedToken = jwt.verify(token, secretKey);

    if (decodedToken && typeof decodedToken !== "string") {
      return decodedToken as JwtPayload;
    }

    return null;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
};

export const generateToken = (payload: object) => {
  if (!secretKey) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }

  const token = jwt.sign(payload, secretKey, { expiresIn: JWT_EXPIRATION });

  return token;
};
export const GetUserType = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token);

    if (decoded && typeof decoded !== "string") {
      const { userType } = decoded as JwtPayload & { userType?: string };

      return userType || null;
    }

    return null;
  } catch (err) {
    console.error("Token decoding error:", err);
    return null;
  }
};

export const GetUserRole = (token: string): string[] | null => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded !== "string") {
      const { userRoles } = decoded as JwtPayload & { userRoles?: string[] };
      return userRoles || null;
    }
    return null;
  } catch (err) {
    console.error("Token decoding error:", err);
    return null;
  }
};

export const GetUserId = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token);

    if (decoded && typeof decoded !== "string") {
      const { UserId } = decoded as JwtPayload & { UserId?: string };

      return UserId || null;
    }

    return null;
  } catch (err) {
    console.error("Token decoding error:", err);
    return null;
  }
};
