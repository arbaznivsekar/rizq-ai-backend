import { Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  roles: z.array(z.string()).default([])
});

export async function me(req: Request, res: Response) {
  res.json({ user: (req as any).user });
}

export async function login(req: Request, res: Response) {
  try {
    // Validate input
    const validationResult = LoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors
      });
    }

    const { email, password } = validationResult.data;

    // For demo purposes, accept any email/password combination
    // In production, you would verify against database
    if (email && password) {
      // Create JWT token
      const token = jwt.sign(
        {
          sub: env.MOCK_USER_ID,
          email: email,
          name: email.split('@')[0], // Use email prefix as name
          roles: ["user"]
        },
        env.NEXTAUTH_SECRET,
        {
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
          expiresIn: '24h'
        }
      );

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: "Login successful",
        token: token,
        user: {
          id: env.MOCK_USER_ID,
          email: email,
          name: email.split('@')[0],
          roles: ["user"]
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }
  } catch (error: any) {
    logger.error(`Login failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Login failed",
      details: error.message
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    // Validate input
    const validationResult = RegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors
      });
    }

    const { email, password, name, phone, roles } = validationResult.data;

    // For demo purposes, always succeed
    // In production, you would check if user exists and create in database
    
    // Create JWT token
    const token = jwt.sign(
      {
        sub: env.MOCK_USER_ID,
        email: email,
        name: name,
        roles: roles
      },
      env.NEXTAUTH_SECRET,
      {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        expiresIn: '24h'
      }
    );

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token: token,
      user: {
        id: env.MOCK_USER_ID,
        email: email,
        name: name,
        phone: phone,
        roles: roles
      }
    });
  } catch (error: any) {
    logger.error(`Registration failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      details: error.message
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    // In a real app, you might blacklist the token
    // For now, just return success
    res.json({
      success: true,
      message: "Logout successful"
    });
  } catch (error: any) {
    logger.error(`Logout failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Logout failed",
      details: error.message
    });
  }
}

