import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthService {
  async signup({ name, email, password, userAgent, ipAddress }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    const personalWorkspace = await Workspace.create({
      name,
      type: 'personal',
      ownerId: user._id,
      currency: 'USD',
      monthlyExpenseLimit: 0,
    });

    user.defaultWorkspaceId = personalWorkspace._id;
    await user.save();

    const tokens = await this.#issueTokens(user, { userAgent, ipAddress });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        defaultWorkspaceId: user.defaultWorkspaceId,
      },
      ...tokens,
    };
  }

  async login({ email, password, userAgent, ipAddress }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const tokens = await this.#issueTokens(user, { userAgent, ipAddress });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        defaultWorkspaceId: user.defaultWorkspaceId,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token missing');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (_error) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await RefreshToken.findOne({
      tokenHash,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!stored) {
      throw new ApiError(401, 'Refresh token revoked');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        defaultWorkspaceId: user.defaultWorkspaceId,
      },
      accessToken,
      refreshToken,
      refreshMaxAge: THIRTY_DAYS_MS,
    };
  }

  async logout(refreshToken) {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    await RefreshToken.updateOne(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  async me(userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      defaultWorkspaceId: user.defaultWorkspaceId,
      preferences: user.preferences,
    };
  }

  async #issueTokens(user, { userAgent, ipAddress }) {
    const basePayload = { sub: user._id.toString(), email: user.email };
    const accessToken = signAccessToken(basePayload);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const refreshToken = signRefreshToken({
        ...basePayload,
        jti: crypto.randomUUID(),
      });
      const tokenHash = hashRefreshToken(refreshToken);
      const decodedExp = verifyRefreshToken(refreshToken).exp;

      try {
        await RefreshToken.create({
          userId: user._id,
          tokenHash,
          expiresAt: new Date(decodedExp * 1000),
          userAgent: userAgent || '',
          ipAddress: ipAddress || '',
        });

        return { accessToken, refreshToken, refreshMaxAge: THIRTY_DAYS_MS };
      } catch (error) {
        if (error?.code !== 11000 || attempt === 2) {
          throw error;
        }
      }
    }

    throw new ApiError(500, 'Unable to issue refresh token');
  }
}
