import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/userRepository";
import { PockityErrorBadRequest, PockityErrorAuthentication } from "../utils/response/PockityErrorClasses";
import { generateToken } from "../utils/token";
import { compareHashedData, hashData } from "../utils/hash";
import { AuthMethod, Role } from "@prisma/client";
import { GoogleUserResult } from "../utils/googleAuth";

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
      emailVerified: true,
      role: Role.USER,
      authMethod: AuthMethod.PASSWORD,
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
    if (!user.passwordHash) {
      throw new PockityErrorAuthentication({
        message: "No password found for this user",
        httpStatusCode: 401,
      });
    }
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

  async oAuth(userData: GoogleUserResult): Promise<AuthResponse> {
    const user = await UserRepository.upsertByEmail(userData.email, {
      email: userData.email,
      name: !userData.name ? `${userData.given_name} ${userData.family_name}` : userData.name,
      picture: userData.picture,
      passwordHash: null,
      authMethod: AuthMethod.OAUTH,
      googleId: userData.id,
      emailVerified: userData.verified_email || false,
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
};
