// tokenStorage.js - Centralized token storage management with security best practices

/**
 * TOKEN STORAGE DECISION & RATIONALE
 * 
 * Storage Method: localStorage
 * 
 * Why localStorage?
 * 1. SPA (Single Page Application) architecture - no server-side rendering
 * 2. Token persistence across page refreshes (24h expiry)
 * 3. Cross-tab synchronization (user logged in across tabs)
 * 4. Simple implementation for client-side token management
 * 
 * Security Considerations:
 * - Tokens are vulnerable to XSS attacks (any JavaScript can access localStorage)
 * - Mitigation: 
 *   * Content Security Policy (CSP) headers on backend
 *   * Input sanitization to prevent XSS
 *   * HTTPS only in production
 *   * Token expiration (24h) limits exposure window
 *   * No sensitive data in token (only id and role)
 * 
 * Alternative Considered: HttpOnly Cookies
 * - More secure (not accessible to JavaScript)
 * - Requires backend changes (Set-Cookie headers)
 * - Requires CSRF protection
 * - More complex implementation
 * - Chosen localStorage for simplicity and SPA architecture
 * 
 * Future Enhancements:
 * - Implement refresh tokens for better security
 * - Add token rotation
 * - Consider HttpOnly cookies for production
 */

const TOKEN_KEY = "token";
const TOKEN_EXPIRY_KEY = "token_expiry";

/**
 * Store JWT token securely
 * @param {string} token - JWT token to store
 * @param {number} expiresInHours - Token expiry in hours (default: 24)
 */
function setToken(token, expiresInHours = 24) {
  try {
    if (!token || typeof token !== "string") {
      throw new Error("Invalid token provided");
    }

    // Store token
    localStorage.setItem(TOKEN_KEY, token);

    // Calculate and store expiry timestamp
    const expiryTime = Date.now() + (expiresInHours * 60 * 60 * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

    return true;
  } catch (error) {
    console.error("Error storing token:", error);
    return false;
  }
}

/**
 * Retrieve JWT token from storage
 * @returns {string|null} Token or null if not found/expired
 */
function getToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      return null;
    }

    // Check if token is expired
    if (isTokenExpired()) {
      removeToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
}

/**
 * Check if stored token is expired
 * @returns {boolean} True if token is expired or missing
 */
function isTokenExpired() {
  try {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!expiryTime) {
      return true; // No expiry stored, consider expired
    }

    const expiryTimestamp = parseInt(expiryTime, 10);
    const now = Date.now();

    return now >= expiryTimestamp;
  } catch (error) {
    console.error("Error checking token expiry:", error);
    return true; // On error, consider expired for security
  }
}

/**
 * Remove token from storage
 */
function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return true;
  } catch (error) {
    console.error("Error removing token:", error);
    return false;
  }
}

/**
 * Check if user has a valid token
 * @returns {boolean} True if valid token exists
 */
function hasValidToken() {
  const token = getToken();
  return token !== null && !isTokenExpired();
}

/**
 * Get token expiry time (for display/debugging)
 * @returns {Date|null} Expiry date or null
 */
function getTokenExpiry() {
  try {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return null;
    
    const expiryTimestamp = parseInt(expiryTime, 10);
    return new Date(expiryTimestamp);
  } catch (error) {
    console.error("Error getting token expiry:", error);
    return null;
  }
}

/**
 * Get time remaining until token expiry
 * @returns {number|null} Milliseconds until expiry, or null if expired
 */
function getTimeUntilExpiry() {
  try {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return null;

    const expiryTimestamp = parseInt(expiryTime, 10);
    const now = Date.now();
    const remaining = expiryTimestamp - now;

    return remaining > 0 ? remaining : null;
  } catch (error) {
    console.error("Error calculating time until expiry:", error);
    return null;
  }
}

/**
 * Decode JWT token payload (without verification)
 * Note: This only decodes, does not verify signature
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null
 */
function decodeToken(token) {
  try {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * Get token payload (decoded)
 * @returns {object|null} Token payload or null
 */
function getTokenPayload() {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token);
}

// Make functions globally available
window.tokenStorage = {
  setToken,
  getToken,
  removeToken,
  hasValidToken,
  isTokenExpired,
  getTokenExpiry,
  getTimeUntilExpiry,
  decodeToken,
  getTokenPayload
};

