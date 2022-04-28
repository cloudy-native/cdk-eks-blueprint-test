import {
  AppMeshAddOn,
  ArgoCDAddOn,
  AwsLoadBalancerControllerAddOn,
  ClusterAddOn,
  ClusterAutoScalerAddOn,
  ContainerInsightsAddOn,
  CoreDnsAddOn,
  DirectVpcProvider,
  EksBlueprint,
  FargateClusterProvider,
  GlobalResources,
  MetricsServerAddOn,
} from "@aws-quickstart/eks-blueprints";
import * as cdk from "aws-cdk-lib";
import { Environment, Stack, StackProps } from "aws-cdk-lib";
import { IVpc, Vpc } from "aws-cdk-lib/aws-ec2";
import { FargateProfileOptions, KubernetesVersion } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import "source-map-support/register";

const app = new cdk.App();

const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

class VpcStack extends Stack {
  readonly vpc: IVpc;

  get availabilityZones(): string[] {
    return ["us-east-1b", "us-east-1c", "us-east-1d"];
  }

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, "vpc", {
      maxAzs: 2,
    });
  }
}

const vpcStack = new VpcStack(app, "vpc-stack", { env });

const addOns: Array<ClusterAddOn> = [
  new ArgoCDAddOn(),
  new AppMeshAddOn(),
  new MetricsServerAddOn(),
  new ClusterAutoScalerAddOn(),
  new ContainerInsightsAddOn(),
  new AwsLoadBalancerControllerAddOn(),
  // new VpcCniAddOn(),
  new CoreDnsAddOn(),
  // new KubeProxyAddOn(),
  // new XrayAddOn(),
];

const fargateProfiles: Map<string, FargateProfileOptions> = new Map([
  ["custom", { selectors: [{ namespace: "default" }] }],
]);

const fargateClusterProvider = new FargateClusterProvider({
  fargateProfiles,
  version: KubernetesVersion.V1_22,
  vpc: vpcStack.vpc,
});

const vpcResourceProvider = EksBlueprint.builder()
  .account(process.env.CDK_DEFAULT_ACCOUNT)
  .region(process.env.CDK_DEFAULT_REGION)
  .addOns(...addOns)
  // .clusterProvider(fargateClusterProvider)
  .resourceProvider(GlobalResources.Vpc, new DirectVpcProvider(vpcStack.vpc))
  .build(app, "eks-blueprint");
