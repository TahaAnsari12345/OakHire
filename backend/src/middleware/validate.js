/**
 * Validates req.body against a zod schema and replaces it with the parsed
 * (coerced, stripped) value. Responds 400 with the first issue otherwise.
 * @param {import('zod').ZodTypeAny} schema
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
      return res.status(400).json({ message: `${path}${issue.message}` });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
