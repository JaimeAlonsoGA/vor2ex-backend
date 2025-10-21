import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { config } from './config';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error:', error);

    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message
    });
};

export const validateSearchTerm = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { searchTerm } = req.query;

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
        res.status(400).json({
            success: false,
            error: 'Valid search term is required'
        });
        return;
    }

    next();
};


export interface AuthenticatedRequest extends Request {
    userId?: string;
    user?: any;
}

export const authenticateUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Authorization token required'
            });
            return;
        }

        const token = authHeader.substring(7);
        const supabase = createClient(config.supabase.url, config.supabase.anonKey);

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
            return;
        }

        req.userId = user.id;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};