export const notFound = (req, _res, next) => next({ status: 404, message: `No se encontró la ruta ${req.method} ${req.originalUrl}.` })
