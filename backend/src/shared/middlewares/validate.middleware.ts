import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod/v3';

const formatZodError = (error: ZodError) => {
    return error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
    }));
};

export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            console.error('[Error] Datos inválidos', req.body);
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Datos inválidos',
                    detalles: formatZodError(error),
                });
                return;
            }
            next(error);
        }
    };
};

export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Parametros inválidos',
                    detalles: formatZodError(error),
                });
                return;
            }
            next(error);
        }
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Query inválida',
                    detalles: formatZodError(error),
                });
                return;
            }
            next(error);
        }
    };
};
