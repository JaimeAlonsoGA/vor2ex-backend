import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    supabase: {
        url: process.env.SUPABASE_URL!,
        anonKey: process.env.SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        projectRef: process.env.SUPABASE_PROJECT_REF!,
    },
    amazon: {
        clientId: process.env.AMAZON_CLIENT_ID!,
        clientSecret: process.env.AMAZON_CLIENT_SECRET!,
        refreshTokenEuWest: process.env.AMAZON_REFRESH_TOKEN_EU_WEST!,
        refreshTokenUsEast: process.env.AMAZON_REFRESH_TOKEN_US_EAST!,
    },
    alibaba: {
        secretId: process.env.ALIBABA_SECRET_ID!,
        appKey: process.env.ALIBABA_APP_KEY!,
    },
    decodo: {
        apiKey: process.env.DECODO_AMAZON_PRODUCTS_APIKEY!,
        authKey: process.env.DECODO_AUTHENTICATION_KEY!,
        password: process.env.DECODO_PASSWORD!,
        accessToken: process.env.DECODO_ACCESS_TOKEN!,
        realtimeEndpoint: process.env.DECODO_REALTIME_ENDPOINT!,
    }
};

export const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:4173'
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};