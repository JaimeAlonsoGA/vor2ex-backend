import { config } from '../../config';
import { Credential } from '../../types';
import { AmazonFeesEstimateResponse } from '../../types/amazon/sp-api/get-fee-estimates';
import { AmazonOfferResponse } from '../../types/amazon/sp-api/get-item-offers';
import { ApiResponse } from '../../types/definitions';
import { getEndpointForMarketplace } from '../../utils/endpoints';
import { CredentialsService } from '../credentials.service';
import { AbortController } from 'abort-controller';

export class AmazonService {
    private credentialsService: CredentialsService;

    constructor() {
        this.credentialsService = new CredentialsService();
    }

    async validateAndGetCredentials(userId: string): Promise<Credential> {
        let credentials = await this.credentialsService.getCredentials(userId);

        if (!credentials) {
            // No credentials exist - create new ones
            await this.createNewCredentials(userId);
            credentials = await this.credentialsService.getCredentials(userId);
        }

        if (!credentials) {
            throw new Error('Failed to create Amazon credentials');
        }

        // Check if token needs refresh
        if (this.credentialsService.needsRefresh(credentials)) {
            await this.refreshCredentials(userId, credentials);
            credentials = await this.credentialsService.getCredentials(userId);
        }

        if (!credentials?.amz_access_token) {
            throw new Error('Amazon access token is not available');
        }

        return credentials;
    }

    private async createNewCredentials(userId: string): Promise<void> {
        const domain = 'com'; // Default domain
        const token = await this.fetchAccessToken(domain);
        await this.credentialsService.createAmazonCredentials(userId, token, domain);
    }

    private async refreshCredentials(userId: string, credentials: Credential): Promise<void> {
        const domain = credentials.amz_marketplace;
        const token = await this.fetchAccessToken(domain, credentials.amz_refresh_token || undefined);
        await this.credentialsService.updateAmazonCredentials(userId, token, domain);
    }

    private async fetchAccessToken(domain: string, refreshToken?: string): Promise<string> {
        const region = getAmazonRegionFromDomain(domain);
        const tokenConfig = this.getRefreshTokenConfig(region, refreshToken);
        
        if (!tokenConfig) {
            throw new Error('No refresh token found for the specified region');
        }

        // Implement token fetching logic here
        return 'mocked_token';
    }

    private getRefreshTokenConfig(region: string, refreshToken?: string): string | undefined {
        if (refreshToken) {
            return refreshToken;
        }

        switch (region) {
            case 'North America':
                return config.AMAZON_REFRESH_TOKEN_NA;
            case 'Europe':
                return config.AMAZON_REFRESH_TOKEN_EU;
            case 'Far East':
                return config.AMAZON_REFRESH_TOKEN_FAR_EAST;
            default:
                return undefined;
        }
    }

    async fetchCatalogItems(
        keywords: string,
        marketplace: string,
        userId: string,
        filters?: {
            minPrice?: number;
            maxPrice?: number;
            minReviews?: number;
            minRating?: number;
            minSalesRank?: number;
        }
    ): Promise<ApiResponse> {
        try {
            const credentials = await this.validateAndGetCredentials(userId);
            const endpoint = getEndpointForMarketplace(marketplace);

            const response = await this.fetchAmazon(
                `${endpoint}/products/search`,
                {
                    keywords,
                    marketplace,
                    filters
                },
                credentials.amz_access_token
            );

            if (!response.success) {
                return response;
            }

            // Apply filtering if filters are provided
            if (filters) {
                response.data = this.applyFilters(response.data, filters);
            }

            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            };
        }
    }

    async fetchNextAmazonCatalogPage(
        pageToken: string,
        keywords: string,
        marketplace: string,
        userId: string
    ): Promise<ApiResponse> {
        try {
            const credentials = await this.validateAndGetCredentials(userId);
            const endpoint = getEndpointForMarketplace(marketplace);

            const response = await this.fetchAmazon(
                `${endpoint}/products/search/next`,
                {
                    pageToken,
                    keywords,
                    marketplace
                },
                credentials.amz_access_token
            );

            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            };
        }
    }

    async fetchPreviousAmazonCatalogPage(
        pageToken: string,
        keywords: string,
        marketplace: string,
        userId: string
    ): Promise<ApiResponse> {
        try {
            const credentials = await this.validateAndGetCredentials(userId);
            const endpoint = getEndpointForMarketplace(marketplace);

            const response = await this.fetchAmazon(
                `${endpoint}/products/search/previous`,
                {
                    pageToken,
                    keywords,
                    marketplace
                },
                credentials.amz_access_token
            );

            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            };
        }
    }

    async fetchCatalogItem(
        asin: string,
        marketplace: string,
        userId: string
    ): Promise<ApiResponse> {
        try {
            const credentials = await this.validateAndGetCredentials(userId);
            const endpoint = getEndpointForMarketplace(marketplace);

            const response = await this.fetchAmazon(
                `${endpoint}/products/item`,
                {
                    asin,
                    marketplace
                },
                credentials.amz_access_token
            );

            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            };
        }
    }

    async getItemOffers(
        asin: string,
        marketplace: string,
        userId: string
    ): Promise<ApiResponse> {
        try {
            const credentials = await this.validateAndGetCredentials(userId);
            const endpoint = getEndpointForMarketplace(marketplace);

            const response = await this.fetchAmazon(
                `${endpoint}/products/offers`,
                {
                    asin,
                    marketplace
                },
                credentials.amz_access_token
            );

            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            };
        }
    }

    async getFeesEstimate(
        asin: string,
        price: number,
        marketplace: string,
        userId: string
    ): Promise<ApiResponse> {
        try {
            const credentials = await this.validateAndGetCredentials(userId);
            const endpoint = getEndpointForMarketplace(marketplace);

            const response = await this.fetchAmazon(
                `${endpoint}/products/fees`,
                {
                    asin,
                    price,
                    marketplace
                },
                credentials.amz_access_token
            );

            return response;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            };
        }
    }

    private async fetchAmazon(
        url: string,
        params: any,
        accessToken: string
    ): Promise<ApiResponse> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify(params),
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return {
                    success: true,
                    data
                };
            } finally {
                clearTimeout(timeout);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timed out after 10 seconds'
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            };
        }
    }

    private applyFilters(items: any[], filters: {
        minPrice?: number;
        maxPrice?: number;
        minReviews?: number;
        minRating?: number;
        minSalesRank?: number;
    }): any[] {
        return items.filter(item >> {
            let passes = true;

            if (filters.minPrice !== undefined) {
                const price = item.summaries[0]?.buyBoxPrices?.[0]?.listingPrice?.amount;
                if (price === undefined || price < filters.minPrice) {
                    passes = false;
                }
            }

            if (filters.maxPrice !== undefined) {
                const price = item.summaries[0]?.buyBoxPrices?.[0]?.listingPrice?.amount;
                if (price === undefined || price > filters.maxPrice) {
                    passes = false;
                }
            }

            if (filters.minReviews !== undefined) {
                const reviews = item.summaries[0]?.totalAmazonReviews;
                if (reviews === undefined || reviews < filters.minReviews) {
                    passes = false;
                }
            }

            if (filters.minRating !== undefined) {
                // Rating might be available in offers data
                const rating = item.offers?.[0]?.rating;
                if (rating === undefined || rating < filters.minRating) {
                    passes = false;
                }
            }

            if (filters.minSalesRank !== undefined) {
                const salesRank = item.salesRanks[0]?.displayGroupRanks?.[0]?.rank;
                if (salesRank === undefined || salesRank > filters.minSalesRank) {
                    passes = false;
                }
            }

            return passes;
        });
    }
}