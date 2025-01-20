const jwtVerify = require('jsonwebtoken').verify;

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autorización no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token de autorización mal formado' });
  }

  try {
    const payload = await jwtVerify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Token de autorización inválido', details: error.message });
  }
};

module.exports = authenticate;