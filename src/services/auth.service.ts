import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const authService = {
  async register(email: string, password: string) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });

    // Générer les tokens
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return {
      user,
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  },

  async login(email: string, password: string) {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Générer les tokens
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  },

  async refreshToken(refreshToken: string) {
    // Vérifier le refresh token
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;

    // Vérifier la version du token
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new AppError('Refresh token invalide', 401);
    }

    // Générer un nouveau access token
    const newPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    return {
      accessToken: generateAccessToken(newPayload),
    };
  },

  async logout(userId: string) {
    // Incrémenter tokenVersion pour invalider tous les refresh tokens
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { message: 'Déconnecté avec succès' };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }
    return user;
  },
};