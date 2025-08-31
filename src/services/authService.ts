import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/userRepository";
import { env } from "../config/env";
import { JwtPayload } from "../middleware/jwtAuth";
import {
  PockityErrorBadRequest,
  PockityErrorAuthentication,
} from "../utils/response/PockityErrorClasses";

export interface RegisterUserData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  token: string;
}

export const AuthService = {
  async register(userData: RegisterUserData): Promise<AuthResponse> {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new PockityErrorBadRequest({
        message: "User with this email already exists",
        httpStatusCode: 400,
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await UserRepository.create({
      email,
      passwordHash,
      name: name || null,
      emailVerified: false,
      role: "USER",
    });

    // Generate JWT token
    const token = await AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  },

  async login(userData: LoginUserData): Promise<AuthResponse> {
    const { email, password } = userData;

    // Find user by email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new PockityErrorAuthentication({
        message: "Invalid email or password",
        httpStatusCode: 401,
      });
    }

    // Check if user has a password (for users registered via OAuth, passwordHash might be null)
    if (!user.passwordHash) {
      throw new PockityErrorAuthentication({
        message: "Please login using your OAuth provider",
        httpStatusCode: 401,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new PockityErrorAuthentication({
        message: "Invalid email or password",
        httpStatusCode: 401,
      });
    }

    // Generate JWT token
    const token = await AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  },

  async generateToken(payload: JwtPayload): Promise<string> {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: "24h", // Token expires in 24 hours
      issuer: "pockity",
      audience: "pockity-users",
    });
  },

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new PockityErrorAuthentication({
          message: "Authentication token has expired",
          httpStatusCode: 401,
        });
      } else if (error.name === "JsonWebTokenError") {
        throw new PockityErrorAuthentication({
          message: "Invalid authentication token",
          httpStatusCode: 401,
        });
      } else {
        throw new PockityErrorAuthentication({
          message: "Authentication failed",
          httpStatusCode: 401,
        });
      }
    }
  },
};