export const toPostgresTimestamp = (date: Date) => {
    return date.toISOString();
};

export const fromPostgresTimestamp = (timestamp: string) => {
    return new Date(timestamp);
};
