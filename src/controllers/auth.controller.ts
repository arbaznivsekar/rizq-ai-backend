import { Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import User from "../models/User.js";

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
  try {
    const userId = (req as any).user.id;
    
    // Fetch full user profile from database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Return user profile without sensitive data
    res.json({
      success: true,
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        phone: user.phone,
        roles: user.roles,
        gmailConnectedAt: user.gmailConnectedAt
      }
    });
  } catch (error: any) {
    logger.error(`Failed to fetch user profile: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user profile",
      details: error.message
    });
  }
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

    // Find user in database (include password field for verification)
    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // Verify password
    const isPasswordValid = await (user as any).comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles
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
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles: user.roles
      }
    });
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists with this email"
      });
    }

    // Create new user in database
    const newUser = new User({
      email,
      password, // Will be hashed automatically by the pre-save hook
      name,
      phone,
      roles: roles.length > 0 ? roles : ["user"]
    });

    await newUser.save();

    // Create JWT token
    const token = jwt.sign(
      {
        sub: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        roles: newUser.roles
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
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        roles: newUser.roles
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
    const userId = (req as any).user?.id;
    
    // Clear the HttpOnly cookie by setting it with an expired date
    res.clearCookie('token', {
      httpOnly: true,
      secure: (env.NODE_ENV === 'production'),
      sameSite: 'lax',
      path: '/',
    });
    
    logger.info(`User logged out successfully`, { userId });
    
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

