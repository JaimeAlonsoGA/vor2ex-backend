export interface AmazonOfferResponse {
  payload: {
    ASIN: string;
    status: string;
    ItemCondition: string;
    Identifier: {
      MarketplaceId: string;
      ItemCondition: string;
      ASIN: string;
    };
    Summary: {
      LowestPrices: Array<{
        condition: string;
        fulfillmentChannel: string;
        LandedPrice: {
          CurrencyCode: string;
          Amount: number;
        };
        ListingPrice: {
          CurrencyCode: string;
          Amount: number;
        };
        Shipping: {
          CurrencyCode: string;
          Amount: number;
        };
      }>;
      BuyBoxPrices: Array<{
        condition: string;
        LandedPrice: {
          CurrencyCode: string;
          Amount: number;
        };
        ListingPrice: {
          CurrencyCode: string;
          Amount: number;
        };
        Shipping: {
          CurrencyCode: string;
          Amount: number;
        };
      }>;
      NumberOfOffers: Array<{
        condition: string;
        fulfillmentChannel: string;
        OfferCount: number;
      }>;
      BuyBoxEligibleOffers: Array<{
        condition: string;
        fulfillmentChannel: string;
        OfferCount: number;
      }>;
      SalesRankings: Array<{
        ProductCategoryId: string;
        Rank: number;
      }>;
      TotalOfferCount: number;
    };
    Offers: Array<{
      Shipping: {
        CurrencyCode: string;
        Amount: number;
      };
      ListingPrice: {
        CurrencyCode: string;
        Amount: number;
      };
      ShippingTime: {
        maximumHours: number;
        minimumHours: number;
        availabilityType: string;
      };
      SellerFeedbackRating: {
        FeedbackCount: number;
        SellerPositiveFeedbackRating: number;
      };
      PrimeInformation: {
        IsPrime: boolean;
        IsNationalPrime: boolean;
      };
      SubCondition: string;
      SellerId: string;
      IsFeaturedMerchant: boolean;
      IsBuyBoxWinner: boolean;
      IsFulfilledByAmazon: boolean;
    }>;
    marketplaceId: string;
  };
}

export interface AmazonOfferError {
  code: string;
  message: string;
  details: string;
}
