const { getSession } = require("../services/supabaseClient");

const authenticate = async (req, res, next) => {
    try {
        const session = await getSession(req.headers.authorization); // Pass token from headers
        if (!session || !session.user) {
            return res.status(401).send("No autenticado");
        }
        req.user = session.user; // Attach user to request object
        next();
    } catch (error) {
        console.error("Error en la autenticación:", error.message);
        res.status(401).send("No autenticado");
    }
};

module.exports = authenticate;
