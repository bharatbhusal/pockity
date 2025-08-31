import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/userRepository";
import { PockityErrorBadRequest, PockityErrorAuthentication } from "../utils/response/PockityErrorClasses";
import { generateToken } from "@/utils/token";
import { compareHashedData, hashData } from "@/utils/hash";

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
    const passwordHash = await hashData(password);

    // Create user
    const user = await UserRepository.create({
      email,
      passwordHash,
      name: name || null,
      emailVerified: false,
      role: "USER",
    });

    // Generate JWT token
    const token = await generateToken({
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

    // Verify password
    const isPasswordValid = await compareHashedData(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new PockityErrorAuthentication({
        message: "Invalid email or password",
        httpStatusCode: 401,
      });
    }

    // Generate JWT token
    const token = await generateToken({
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
};
