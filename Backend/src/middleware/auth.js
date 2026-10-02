const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

exports.auth = (req, res, next) => {
    try {
        // Authorization: Bearer xxxxxxxxx
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return error(res, 401, "Token manquant");
        }

        if (!authHeader.startsWith("Bearer ")) {
            return error(res, 401, "Format du token invalide");
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "votre_cle_secrete_icisdsdhzuagfjfbs_sdbs"
        );

        // Informations de l'utilisateur connecté
        req.user = decoded;

        next();

    } catch (err) {
        return error(res, 401, "Token invalide ou expiré");
    }
};