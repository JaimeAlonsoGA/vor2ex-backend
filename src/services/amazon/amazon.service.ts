import { config } from '../../config';
import { Credential } from '../../types';
import { AmazonFeesEstimateResponse } from '../../types/amazon/sp-api/get-fee-estimates';
import { AmazonOfferResponse } from '../../types/amazon/sp-api/get-item-offers';
import { ApiResponse } from '../../types/definitions';
import { getAmazonRegionFromDomain } from '../../utils/amazon.utils';
import { CredentialsService } from '../credentials.service';

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
        await this.credentialsService.updateAmazonCredentials(userId, token);
    }

    async fetchAmazon({
        method = "GET",
        query,
        body,
        userId
    }: {
        method: string;
        query: string;
        body?: string;
        userId: string;
    }): Promise<any> {
        const credentials = await this.validateAndGetCredentials(userId);

        const response = await fetch(`${query}`, {
            method,
            headers: {
                Accept: "application/json",
                "x-amz-access-token": credentials.amz_access_token!,
                "Content-Type": "application/json"
            },
            body,
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(
                `Error fetching from Amazon: ${response.status} ${response.statusText}. Details: ${errorDetails}`
            );
        }
        return response.json();
    }

    async fetchAccessToken(domain: string, token?: string): Promise<any> {
        const region = getAmazonRegionFromDomain(domain);
        const refreshToken = region === "North America"
            ? config.amazon.refreshTokenUsEast
            : config.amazon.refreshTokenEuWest;

        const response = await fetch("https://api.amazon.com/auth/o2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: (token ?? refreshToken) || "",
                client_id: config.amazon.clientId || "",
                client_secret: config.amazon.clientSecret || "",
            })
        });

        if (!response.ok) {
            throw new Error("Error fetching access token");
        }

        return response.json();
    }

    async fetchCatalogItems(keywords: string, endpoint: string, marketplace: string, userId: string): Promise<ApiResponse> {
        try {
            const query = `${endpoint}/catalog/2022-04-01/items?marketplaceIds=${marketplace}&keywords=${keywords}&includedData=salesRanks,productTypes,identifiers,summaries,images&pageSize=20`;
            const data = await this.fetchAmazon({ method: "GET", query, userId });

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch catalog items'
            };
        }
    }

    async fetchNextAmazonCatalogPage(pageToken: string, keywords: string, endpoint: string, marketplace: string, userId: string): Promise<ApiResponse> {
        try {
            const query = `${endpoint}/catalog/2022-04-01/items?marketplaceIds=${marketplace}&keywords=${encodeURIComponent(keywords)}&pageToken=${encodeURIComponent(pageToken)}&includedData=salesRanks,productTypes,identifiers,summaries,images&pageSize=20`;
            const data = await this.fetchAmazon({ method: "GET", query, userId });

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch next page'
            };
        }
    }

    async fetchPreviousAmazonCatalogPage(pageToken: string, keywords: string, endpoint: string, marketplace: string, userId: string): Promise<ApiResponse> {
        try {
            const query = `${endpoint}/catalog/2022-04-01/items?marketplaceIds=${marketplace}&keywords=${encodeURIComponent(keywords)}&pageToken=${encodeURIComponent(pageToken)}&includedData=salesRanks,productTypes,identifiers,summaries,images&pageSize=20`;
            const data = await this.fetchAmazon({ method: "GET", query, userId });

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch previous page'
            };
        }
    }

    async fetchCatalogItem(asin: string, endpoint: string, marketplace: string, userId: string): Promise<ApiResponse> {
        try {
            const query = `${endpoint}/catalog/2022-04-01/items/${asin}?marketplaceIds=${marketplace}&includedData=salesRanks,productTypes,identifiers,summaries,images`;
            const data = await this.fetchAmazon({ method: "GET", query, userId });

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch catalog item'
            };
        }
    }

    async getItemOffers(asin: string, endpoint: string, marketplace: string, userId: string): Promise<ApiResponse<AmazonOfferResponse>> {
        try {
            const query = `${endpoint}/products/pricing/v0/items/${asin}/offers?MarketplaceId=${marketplace}&ItemCondition=New`;
            const data = await this.fetchAmazon({ method: "GET", query, userId });

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch item offers'
            };
        }
    }

    async getFeesEstimate(asin: string, price: number, marketplace: string, userId: string): Promise<ApiResponse<AmazonFeesEstimateResponse>> {
        try {
            const payload = {
                FeesEstimateRequest: {
                    MarketplaceId: marketplace,
                    IdType: "ASIN",
                    IdValue: asin,
                    Identifier: asin,
                    IsAmazonFulfilled: true,
                    PriceToEstimateFees: {
                        ListingPrice: {
                            CurrencyCode: "EUR",
                            Amount: price,
                        },
                        Shipping: {
                            CurrencyCode: "EUR",
                            Amount: 0,
                        },
                    },
                },
            };

            const query = `/products/fees/v0/listings/fees`;
            const data = await this.fetchAmazon({
                method: "POST",
                query,
                body: JSON.stringify(payload),
                userId
            });

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get fees estimate'
            };
        }
    }
}