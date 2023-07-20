export default function cors(config) {
    return (req, res, next) => {
        const origin = req.headers.origin;
        if (origin && config?.origin?.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
            if (req.method === "OPTIONS") {
                return res.sendStatus(200);
            }
            return next();
        }
        else {
            return res.status(403).json({
                message: "Access to the requested resource is forbidden due to not allowed origins.",
            });
        }
    };
}
