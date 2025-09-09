
import jwt from "jsonwebtoken";


export function authenticate(req, res, next) {
  try {
    //  Try Authorization: Bearer <token>
    const auth = req.headers.authorization || "";
    let token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    // 2 Fallback to cookie: token
    if (!token && req.cookies?.token) token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: missing token" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      });
    } catch (err) {
      console.error("JWT verification error:", err.message);
      return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
    }

    // Handle both email and WhatsApp-based tokens
    req.user = {
      id: payload.id || payload.sub,
      email: payload.email || null,
      whatsApp_Number: payload.whatsApp_Number || null,
      role: payload.role || "user"
    };
console.log(req.user,"dgfisud")
    return next();
  } catch (e) {
    console.error("Authentication middleware error:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}


export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}
