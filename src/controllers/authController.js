import { AuthService } from '../services/AuthService.js';

const authService = new AuthService();

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
};

export const signup = async (req, res) => {
  const result = await authService.signup({
    ...req.validated,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.cookie('refreshToken', result.refreshToken, {
    ...refreshCookieOptions,
    maxAge: result.refreshMaxAge,
  });

  res.status(201).json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const login = async (req, res) => {
  const result = await authService.login({
    ...req.validated,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.cookie('refreshToken', result.refreshToken, {
    ...refreshCookieOptions,
    maxAge: result.refreshMaxAge,
  });

  res.json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const refresh = async (req, res) => {
  const result = await authService.refresh(req.cookies.refreshToken);

  res.cookie('refreshToken', result.refreshToken, {
    ...refreshCookieOptions,
    maxAge: result.refreshMaxAge,
  });

  res.json({
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const logout = async (req, res) => {
  await authService.logout(req.cookies.refreshToken);
  res.clearCookie('refreshToken', refreshCookieOptions);
  res.json({ success: true });
};

export const me = async (req, res) => {
  const user = await authService.me(req.user.id);
  res.json({ user });
};
