import { AmazonOfferResponse } from "./get-item-offers";

export interface AmazonResponse {
  numberOfResults: number;
  pagination?: {
    nextToken?: string;
    previousToken?: string;
  };
  refinements?: {
    brands?: Array<{
      numberOfResults: number;
      brandName: string;
    }>;
    categories?: Array<{
      numberOfResults: number;
      displayName: string;
      classificationId: string;
    }>;
  };
  items: AmazonItem[];
}


export interface AmazonItem {
  asin: string;
  identifiers?: Array<{
    marketplaceId: string;
    identifiers: Array<{
      identifierType: string;
      identifier: string;
    }>;
  }>;
  images?: Array<{
    marketplaceId: string;
    images: Array<{
      variant: string;
      link: string;
      height: number;
      width: number;
    }>;
  }>;
  productTypes?: Array<{
    marketplaceId: string;
    productType: string;
  }>;
  salesRanks?: Array<{
    marketplaceId: string;
    classificationRanks?: Array<{
      classificationId: string;
      title: string;
      link: string;
      rank: number;
    }>;
    displayGroupRanks?: Array<{
      websiteDisplayGroup: string;
      title: string;
      link: string;
      rank: number;
    }>;
  }>;
  summaries?: {
    marketplaceId: string;
    itemName?: string;
    brand?: string;
    contributors?: Array<{
      role: {
        displayName: string;
        value: string;
      };
      value: string;
    }>;
    releaseDate?: string;
    browseClassification?: {
      displayName: string;
      classificationId: string;
    };
  }[];
  offers: AmazonOfferResponse;
}