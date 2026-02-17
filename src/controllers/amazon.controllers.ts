import { Request, Response } from 'express';
import { AmazonService } from '../services/amazon/amazon.service';
import { AuthenticatedRequest } from '../middleware';

export class AmazonController {
    private amazonService: AmazonService;

    constructor() {
        this.amazonService = new AmazonService();
    }

    getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { keywords, marketplace, minPrice, maxPrice, minReviews, minRating, minSalesRank } = req.query;
            const userId = req.userId!;

            if (!keywords || !marketplace) {
                res.status(400).json({
                    success: false,
                    error: 'Keywords and marketplace are required'
                });
                return;
            }

            const result = await this.amazonService.fetchCatalogItems(
                keywords as string,
                marketplace as string,
                userId,
                {
                    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
                    minReviews: minReviews ? parseInt(minReviews as string) : undefined,
                    minRating: minRating ? parseFloat(minRating as string) : undefined,
                    minSalesRank: minSalesRank ? parseInt(minSalesRank as string) : undefined
                }
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    getProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { asin } = req.params;
            const { marketplace } = req.query;
            const userId = req.userId!;

            if (!asin || !marketplace) {
                res.status(400).json({
                    success: false,
                    error: 'ASIN and marketplace are required'
                });
                return;
            }

            const result = await this.amazonService.fetchCatalogItem(
                asin,
                marketplace as string,
                userId
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    getProductOffers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { asin } = req.params;
            const { marketplace } = req.query;
            const userId = req.userId!;

            if (!asin || !marketplace) {
                res.status(400).json({
                    success: false,
                    error: 'ASIN and marketplace are required'
                });
                return;
            }

            const result = await this.amazonService.getItemOffers(
                asin,
                marketplace as string,
                userId
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    getFeesEstimate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { asin } = req.params;
            const { price, marketplace } = req.query;
            const userId = req.userId!;

            if (!asin || !price || !marketplace) {
                res.status(400).json({
                    success: false,
                    error: 'ASIN, price, and marketplace are required'
                });
                return;
            }

            const result = await this.amazonService.getFeesEstimate(
                asin,
                parseFloat(price as string),
                marketplace as string,
                userId
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    getNextPage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { pageToken, keywords, marketplace } = req.query;
            const userId = req.userId!;

            if (!pageToken || !keywords || !marketplace) {
                res.status(400).json({
                    success: false,
                    error: 'PageToken, keywords, and marketplace are required'
                });
                return;
            }

            const result = await this.amazonService.fetchNextAmazonCatalogPage(
                pageToken as string,
                keywords as string,
                marketplace as string,
                userId
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    getPreviousPage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { pageToken, keywords, marketplace } = req.query;
            const userId = req.userId!;

            if (!pageToken || !keywords || !marketplace) {
                res.status(400).json({
                    success: false,
                    error: 'PageToken, keywords, and marketplace are required'
                });
                return;
            }

            const result = await this.amazonService.fetchPreviousAmazonCatalogPage(
                pageToken as string,
                keywords as string,
                marketplace as string,
                userId
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    validateCredentials = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.userId!;

            const result = await this.amazonService.validateAndGetCredentials(userId);

            res.json({
                valid: true
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to validate credentials'
            });
        }
    };
}