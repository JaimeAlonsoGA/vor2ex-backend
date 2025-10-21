export interface AmazonFeesEstimateResponse {
  FeesEstimateResult: {
    Status: string;
    FeesEstimateIdentifier: {
      MarketplaceId: string;
      SellerId: string;
      IdType: string;
      IdValue: string;
      IsAmazonFulfilled: boolean;
      PriceToEstimateFees: {
        ListingPrice: {
          CurrencyCode: string;
          Amount: number;
        };
        Shipping: {
          CurrencyCode: string;
          Amount: number;
        };
        Points?: {
          PointsNumber: number;
          PointsMonetaryValue: {
            CurrencyCode: string;
            Amount: number;
          };
        };
      };
      OptionalFulfillmentProgram?: string;
    };
    FeesEstimate: {
      TotalFeesEstimate: {
        CurrencyCode: string;
        Amount: number;
      };
      FeeDetailList: Array<{
        FeeType: string;
        FeeAmount: {
          CurrencyCode: string;
          Amount: number;
        };
        FeePromotion?: {
          CurrencyCode: string;
          Amount: number;
        };
        TaxAmount?: {
          CurrencyCode: string;
          Amount: number;
        };
        FinalFee: {
          CurrencyCode: string;
          Amount: number;
        };
        IncludedFeeType?: string;
      }>;
    };
  };
}
