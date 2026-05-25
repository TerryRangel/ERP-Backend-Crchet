export function validate(schema, target = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[target]);

      if (!result.success) {
        const errors = {};

        for (const issue of result.error.issues) {
          const key = issue.path.join('.') || 'root';
          errors[key] = issue.message;
        }

        return res.status(400).json({
          message: 'Error de validación',
          errors
        });
      }

   
      if (target === 'query' || target === 'params') {
       
        Object.keys(req[target]).forEach(key => delete req[target][key]);
        Object.assign(req[target], result.data);
      } else {
        req[target] = result.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}