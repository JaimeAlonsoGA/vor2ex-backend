import { AMAZON_DOMAINS } from "./endpoints";

export function getAmazonRegionFromDomain(domain: string): string | undefined {
    for (const [region, countries] of Object.entries(AMAZON_DOMAINS)) {
        if (Object.values(countries).includes(domain)) {
            return region;
        }
    }
    return undefined;
}