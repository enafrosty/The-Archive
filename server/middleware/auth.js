const crypto = require('crypto');

// Operator/admin token. When set, destructive & admin API routes require it.
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();
let warnedOnce = false;

function timingSafeEqualStr(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    // Length check first; timingSafeEqual throws on length mismatch.
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Gate for destructive / operator-level routes.
 *
 * - If ADMIN_TOKEN is set, requests must present a matching token via the
 *   `x-admin-token` header or an `Authorization: Bearer <token>` header.
 * - If ADMIN_TOKEN is NOT set, requests are allowed but a loud warning is
 *   logged once. This keeps existing local/single-machine setups working
 *   out of the box. Set ADMIN_TOKEN for any network-exposed deployment.
 *
 * To make authentication mandatory (recommended for production), change the
 * `!ADMIN_TOKEN` branch below to `return res.status(503)...` instead of
 * calling `next()`.
 */
function requireAdmin(req, res, next) {
    if (!ADMIN_TOKEN) {
        if (!warnedOnce) {
            console.error(
                '[SECURITY WARNING] ADMIN_TOKEN is not set — admin/destructive API routes are UNPROTECTED. ' +
                'Set ADMIN_TOKEN in the environment (see server/.env.example) to require authentication.'
            );
            warnedOnce = true;
        }
        return next();
    }

    const headerToken = req.get('x-admin-token');
    const authHeader = req.get('authorization') || '';
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : '';
    const provided = headerToken || bearer;

    if (provided && timingSafeEqualStr(provided, ADMIN_TOKEN)) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized: valid admin token required' });
}

module.exports = { requireAdmin, ADMIN_TOKEN_CONFIGURED: !!ADMIN_TOKEN };
