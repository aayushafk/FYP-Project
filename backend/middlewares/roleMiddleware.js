export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized. User context missing.' });
        }

        const hasRole = Array.isArray(roles)
            ? roles.includes(req.user.role)
            : req.user.role === roles;

        if (!hasRole) {
            return res.status(403).json({
                message: `Forbidden. Role matching one of [${roles}] is required.`
            });
        }

        next();
    };
};
