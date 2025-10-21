export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface FetchOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    query: string;
    body?: string;
    headers?: Record<string, string>;
}