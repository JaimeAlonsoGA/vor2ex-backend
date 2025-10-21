import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { Credential, CredentialInsert, CredentialUpdate } from '../types';

export class CredentialsService {
    private supabase;
    private credentialsCache = new Map<string, { credentials: Credential; cachedAt: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

    constructor() {
        this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    }

    async getCredentials(userId: string): Promise<Credential | null> {
        // Check cache first
        const cached = this.credentialsCache.get(userId);
        const now = Date.now();

        if (cached && (now - cached.cachedAt) < this.CACHE_TTL) {
            // Check if token is still valid (not expired)
            const expiresAt = cached.credentials.amz_expires_at
                ? new Date(cached.credentials.amz_expires_at).getTime()
                : 0;

            if (expiresAt > now + (2 * 60 * 1000)) { // 2 min buffer
                return cached.credentials;
            }
            // Token expired/expiring soon, remove from cache
            this.credentialsCache.delete(userId);
        }

        // Fetch from database
        const { data, error } = await this.supabase
            .from('credentials')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return null;
        }

        // Data is already in the correct Credential format from the database
        const credentials: Credential = data;

        // Cache the credentials
        this.credentialsCache.set(userId, {
            credentials,
            cachedAt: now
        });

        return credentials;
    }

    async createAmazonCredentials(userId: string, token: any, marketplace: string = 'com'): Promise<void> {
        const expiresAt = new Date(Date.now() + (token.expires_in * 1000));

        const credentialData: CredentialInsert = {
            user_id: userId,
            amz_access_token: token.access_token,
            amz_refresh_token: token.refresh_token,
            amz_expires_at: expiresAt.toISOString(),
            amz_marketplace: marketplace
        };

        const { error } = await this.supabase
            .from('credentials')
            .insert(credentialData);

        if (error) {
            throw new Error(`Failed to create credentials: ${error.message}`);
        }

        // Add to cache immediately
        const newCredentials: Credential = {
            id: crypto.randomUUID(), // Temporary ID, will be replaced by actual DB ID
            user_id: userId,
            amz_access_token: token.access_token,
            amz_refresh_token: token.refresh_token,
            amz_expires_at: expiresAt.toISOString(),
            amz_marketplace: marketplace
        };

        this.credentialsCache.set(userId, {
            credentials: newCredentials,
            cachedAt: Date.now()
        });
    }

    async updateAmazonCredentials(userId: string, token: any): Promise<void> {
        const expiresAt = new Date(Date.now() + (token.expires_in * 1000));

        const updateData: CredentialUpdate = {
            amz_access_token: token.access_token,
            amz_refresh_token: token.refresh_token,
            amz_expires_at: expiresAt.toISOString()
        };

        const { data, error } = await this.supabase
            .from('credentials')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update credentials: ${error.message}`);
        }

        // Update cache immediately with the returned data
        if (data) {
            this.credentialsCache.set(userId, {
                credentials: data,
                cachedAt: Date.now()
            });
        }
    }

    async deleteCredentials(userId: string): Promise<void> {
        const { error } = await this.supabase
            .from('credentials')
            .delete()
            .eq('user_id', userId);

        if (error) {
            throw new Error(`Failed to delete credentials: ${error.message}`);
        }

        // Remove from cache
        this.credentialsCache.delete(userId);
    }

    // Method to invalidate cache when needed
    invalidateCache(userId: string): void {
        this.credentialsCache.delete(userId);
    }

    // Clear expired cache entries periodically
    cleanupCache(): void {
        const now = Date.now();
        for (const [userId, cached] of this.credentialsCache.entries()) {
            if ((now - cached.cachedAt) > this.CACHE_TTL) {
                this.credentialsCache.delete(userId);
            }
        }
    }

    // Helper method to check if credentials are valid
    isTokenValid(credentials: Credential): boolean {
        if (!credentials.amz_access_token || !credentials.amz_expires_at) {
            return false;
        }

        const expiresAt = new Date(credentials.amz_expires_at).getTime();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        return expiresAt > (now + fiveMinutes);
    }

    // Helper method to check if token needs refresh
    needsRefresh(credentials: Credential): boolean {
        if (!credentials.amz_expires_at) {
            return true;
        }

        const expiresAt = new Date(credentials.amz_expires_at).getTime();
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;

        return expiresAt <= (now + tenMinutes);
    }
}