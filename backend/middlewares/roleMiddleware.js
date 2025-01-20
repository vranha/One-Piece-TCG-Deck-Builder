const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        const userRole = req.user?.app_metadata?.role; // Asumiendo que los roles están en app_metadata

        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: 'No tienes permiso para acceder a esta ruta.' });
        }
        next();
    };
};

module.exports = authorize;
