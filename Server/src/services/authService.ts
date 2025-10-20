import { UserRepository } from "../repositories/userRepository";
import { generateToken } from "../utils/token";
import { GoogleUserResult } from "../utils/googleAuth";

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
  async oAuth(userData: GoogleUserResult): Promise<AuthResponse> {
    const user = await UserRepository.upsertByEmail(userData.email, {
      email: userData.email,
      name: !userData.name ? `${userData.given_name} ${userData.family_name}` : userData.name,
      picture: userData.picture,
      googleId: userData.id,
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
