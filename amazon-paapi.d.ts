declare module "amazon-paapi" {
  declare namespace AmazonPaapi {
    interface CommonParameters {
      AccessKey: string;
      SecretKey: string;
      PartnerTag: string;
      PartnerType: string;
      Marketplace: string;
    }

    interface RequestParameters {
      Keywords: string;
      SearchIndex: string;
      Resources: string[];
      Operation: string;
    }

    interface Data {
      SearchResult?: {
        Items?: {
          DetailPageURL: string;
        }[];
      };
    }

    export function SearchItems(
      commonParameters: CommonParameters,
      requestParameters: RequestParameters
    ): Data;
  }
  export default AmazonPaapi;
}
