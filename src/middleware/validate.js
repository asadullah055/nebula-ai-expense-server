export const validate = (schema, picker = (req) => req.body) => (req, _res, next) => {
  const data = picker(req);
  req.validated = schema.parse(data);
  next();
};
