// Static list of AWS commercial partition regions (GovCloud/China excluded).
export type AwsRegionOption = {
  code: string;
  label: string;
};

export const AWS_REGIONS: AwsRegionOption[] = [
  { code: "af-south-1", label: "Africa (Cape Town) — af-south-1" },
  { code: "ap-east-1", label: "Asia Pacific (Hong Kong) — ap-east-1" },
  { code: "ap-northeast-1", label: "Asia Pacific (Tokyo) — ap-northeast-1" },
  { code: "ap-northeast-2", label: "Asia Pacific (Seoul) — ap-northeast-2" },
  { code: "ap-northeast-3", label: "Asia Pacific (Osaka) — ap-northeast-3" },
  { code: "ap-south-1", label: "Asia Pacific (Mumbai) — ap-south-1" },
  { code: "ap-south-2", label: "Asia Pacific (Hyderabad) — ap-south-2" },
  { code: "ap-southeast-1", label: "Asia Pacific (Singapore) — ap-southeast-1" },
  { code: "ap-southeast-2", label: "Asia Pacific (Sydney) — ap-southeast-2" },
  { code: "ap-southeast-3", label: "Asia Pacific (Jakarta) — ap-southeast-3" },
  { code: "ap-southeast-4", label: "Asia Pacific (Melbourne) — ap-southeast-4" },
  { code: "ap-southeast-5", label: "Asia Pacific (Malaysia) — ap-southeast-5" },
  { code: "ca-central-1", label: "Canada (Central) — ca-central-1" },
  { code: "ca-west-1", label: "Canada West (Calgary) — ca-west-1" },
  { code: "eu-central-1", label: "Europe (Frankfurt) — eu-central-1" },
  { code: "eu-central-2", label: "Europe (Zurich) — eu-central-2" },
  { code: "eu-north-1", label: "Europe (Stockholm) — eu-north-1" },
  { code: "eu-south-1", label: "Europe (Milan) — eu-south-1" },
  { code: "eu-south-2", label: "Europe (Spain) — eu-south-2" },
  { code: "eu-west-1", label: "Europe (Ireland) — eu-west-1" },
  { code: "eu-west-2", label: "Europe (London) — eu-west-2" },
  { code: "eu-west-3", label: "Europe (Paris) — eu-west-3" },
  { code: "il-central-1", label: "Israel (Tel Aviv) — il-central-1" },
  { code: "me-central-1", label: "Middle East (UAE) — me-central-1" },
  { code: "me-south-1", label: "Middle East (Bahrain) — me-south-1" },
  { code: "mx-central-1", label: "Mexico (Central) — mx-central-1" },
  { code: "sa-east-1", label: "South America (São Paulo) — sa-east-1" },
  { code: "us-east-1", label: "US East (N. Virginia) — us-east-1" },
  { code: "us-east-2", label: "US East (Ohio) — us-east-2" },
  { code: "us-west-1", label: "US West (N. California) — us-west-1" },
  { code: "us-west-2", label: "US West (Oregon) — us-west-2" },
];
