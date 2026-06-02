import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../middlewares/error.middleware";

// Configured values or fallbacks for development security
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "fallback_access_secret_token_signature_key_993";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret_token_signature_key_884";
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  companyName?: string;
}

export class AuthService {
  /**
   * Generates secure cryptographic signature JWT keys for merchants
   */
  public static generateTokens(user: UserPayload) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyName: user.companyName },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Registers a merchant profile alongside their business parameters
   */
  public static async registerMerchant(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    companyName: string;
    role: string;
  }) {
    const { email, password, firstName, lastName, companyName, role } = data;

    // 1. Audit unique email parameters prior to database commitment
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      throw new AppError("A merchant profile is already registered under this email.", 409);
    }

    // 2. Cryptographically hash password security strings
    let passwordHash = "";
    if (password) {
      const salt = await bcrypt.genSalt(12);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // 3. Atomically write row fields inside PostgreSQL users table
    const { data: newUser, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: role || "merchant",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error("[AUTH SIGNUP ERROR] PostgreSQL insert failure:", userError?.message);
      throw new AppError(`Merchant user registration aborted. Details: ${userError?.message || "DB Reject"}`, 500);
    }

    // 4. Provision corresponding merchant business store registration profiles
    const { data: newBusiness, error: bizError } = await supabaseAdmin
      .from("businesses")
      .insert({
        owner_id: newUser.id,
        name: companyName,
        kyc_status: "LEVEL_1_PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bizError) {
      console.error("[AUTH BIZ REG ERROR] Profile created but company parameters failed insertion:", bizError.message);
      // Operational robustness: clean up user registration row or proceed with alert to admin queues
    }

    // 5. Build secure token models and profiles
    const tokens = this.generateTokens({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      companyName: companyName
    });

    // Populate user-facing registration result indexes
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        business: newBusiness || null
      },
      ...tokens
    };
  }

  /**
   * Authorizes registration email and matching password keys
   */
  public static async loginMerchant(email: string, password_raw: string) {
    // 1. Seek the registered password sequence matching username strings
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*, businesses(id, name, kyc_status)")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (userError || !user) {
      throw new AppError("Invalid login credentials provided. Review parameters.", 401);
    }

    // 2. Validate hash security password configurations
    const isPasswordValid = await bcrypt.compare(password_raw, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError("Invalid login credentials provided. Review parameters.", 401);
    }

    // Extract business reference
    const businessObj = Array.isArray(user.businesses) ? user.businesses[0] : user.businesses;

    // 3. Formulate bearer authorization tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      companyName: businessObj?.name || ""
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        business: businessObj || null
      },
      ...tokens
    };
  }

  /**
   * Refreshes access tokens based on a cryptographically valid refresh token
   */
  public static async refreshMerchantSession(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string; email: string; role: string };
      
      // Obtain latest record parameters from database to verify active status
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*, businesses(name)")
        .eq("id", decoded.id)
        .maybeSingle();

      if (error || !user) {
        throw new AppError("Session parent row has been deleted or deactivated.", 403);
      }

      const businessObj = Array.isArray(user.businesses) ? user.businesses[0] : user.businesses;

      const tokens = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        companyName: businessObj?.name || ""
      });

      return tokens;
    } catch (err) {
      throw new AppError("Token refresh failed. Invalid or expired refresh credentials.", 403);
    }
  }
}
