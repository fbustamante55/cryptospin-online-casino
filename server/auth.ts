import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
// Import strategies for social login (commented out until API keys are provided)
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { Strategy as FacebookStrategy } from "passport-facebook";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, loginSchema, registrationSchema } from "@shared/schema";
import { ZodError } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "cryptoplay-casino-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours by default
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Helper function to validate reCAPTCHA token
  async function validateRecaptcha(token: string): Promise<boolean> {
    // Skip validation if no API key is available
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.warn('RECAPTCHA_SECRET_KEY not set. Skipping reCAPTCHA validation.');
      return true;
    }
    
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('reCAPTCHA validation error:', error);
      return false;
    }
  }

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body using Zod schema
      const validatedData = registrationSchema.parse(req.body);
      
      // Validate reCAPTCHA if token is provided
      if (validatedData.recaptchaToken) {
        const isValidRecaptcha = await validateRecaptcha(validatedData.recaptchaToken);
        if (!isValidRecaptcha) {
          return res.status(400).json({ message: "Invalid reCAPTCHA. Please try again." });
        }
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: await hashPassword(validatedData.password),
        phoneNumber: validatedData.phoneNumber,
        country: validatedData.country,
      });

      // Log user in after registration
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without sensitive info
        const { password, ...safeUser } = user;
        return res.status(201).json(safeUser);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Validate reCAPTCHA if token is provided
      if (validatedData.recaptchaToken) {
        const isValidRecaptcha = await validateRecaptcha(validatedData.recaptchaToken);
        if (!isValidRecaptcha) {
          return res.status(400).json({ message: "Invalid reCAPTCHA. Please try again." });
        }
      }
      
      // First check if user exists by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await comparePasswords(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateUserProfile(user.id, { lastLogin: new Date() });
      
      // Set session cookie expiration based on rememberMe
      if (validatedData.rememberMe) {
        // Extend session to 30 days if "Remember Me" is checked
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        // Use default of 24 hours
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
      }
      
      // Log user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without sensitive info
        const { password, ...safeUser } = user;
        return res.status(200).json(safeUser);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Return user without sensitive info
    const { password, ...safeUser } = req.user as SelectUser;
    res.json(safeUser);
  });
  
  // Password reset request endpoint
  app.post("/api/password-reset/request", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal that email doesn't exist for security reasons
        return res.status(200).json({ message: "If your email exists in our system, you'll receive a password reset link shortly." });
      }
      
      // Generate reset token (valid for 1 hour)
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
      
      await storage.updateResetToken(user.id, resetToken, resetTokenExpiry);
      
      // In a real application, we would send an email with the reset link
      // For now, we'll just return the token in the response for testing
      console.log(`Reset token for ${email}: ${resetToken}`);
      
      return res.status(200).json({ 
        message: "If your email exists in our system, you'll receive a password reset link shortly."
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Password reset confirmation endpoint
  app.post("/api/password-reset/confirm", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash the new password and update user
      const hashedPassword = await hashPassword(password);
      await storage.updatePassword(user.id, hashedPassword);
      
      // Clear the reset token
      await storage.updateResetToken(user.id, null, null);
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Phone verification endpoint
  app.post("/api/verify-phone", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to verify your phone number" });
      }
      
      const { phoneNumber, verificationCode } = req.body;
      
      if (!phoneNumber || !verificationCode) {
        return res.status(400).json({ message: "Phone number and verification code are required" });
      }
      
      // In a real app, we would verify the code against what was sent via SMS
      // For now, we'll just check if the code is '123456' for testing
      if (verificationCode !== '123456') {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Update user's phone number and set it as verified
      await storage.updateUserProfile(req.user.id, { phoneNumber });
      await storage.verifyPhone(req.user.id);
      
      return res.status(200).json({ message: "Phone number verified successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // KYC document upload endpoint
  app.post("/api/kyc/upload", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to upload KYC documents" });
      }
      
      const { documentType, documentPath, metadata } = req.body;
      
      if (!documentType || !documentPath) {
        return res.status(400).json({ message: "Document type and document path are required" });
      }
      
      const document = await storage.createKycDocument({
        userId: req.user.id,
        documentType,
        documentPath,
        metadata: metadata || {}
      });
      
      return res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  });
  
  // Get KYC documents for current user
  app.get("/api/kyc/documents", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to view KYC documents" });
      }
      
      const documents = await storage.getKycDocuments(req.user.id);
      return res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  });
}
