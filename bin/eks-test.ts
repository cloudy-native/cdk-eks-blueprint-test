import {
  AppMeshAddOn,
  ArgoCDAddOn,
  AwsForFluentBitAddOn,
  AwsLoadBalancerControllerAddOn,
  ClusterAddOn,
  ClusterAutoScalerAddOn,
  CodePipelineStack,
  ContainerInsightsAddOn,
  CoreDnsAddOn,
  DirectVpcProvider,
  EksBlueprint,
  FargateClusterProvider,
  GlobalResources,
  MetricsServerAddOn,
} from "@aws-quickstart/eks-blueprints";
import { DatadogAddOn } from "@datadog/datadog-eks-blueprints-addon";
import { KubecostAddOn } from "@kubecost/kubecost-eks-blueprints-addon";
import { App, Environment, Stack, StackProps } from "aws-cdk-lib";
import { IVpc, Vpc } from "aws-cdk-lib/aws-ec2";
import { FargateProfileOptions, KubernetesVersion } from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";
import "source-map-support/register";
import { TeamSRE, TeamViewOnly } from "../lib";

const app = new App();

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
  new AppMeshAddOn({
    enableTracing: true,
    tracingProvider: "x-ray",
  }),
  new DatadogAddOn({
    apiKeyExistingSecret: "datadog-secret",
  }),
  new AwsForFluentBitAddOn({
    iamPolicies: [],
    values: {},
  }),
  new MetricsServerAddOn(),
  new ClusterAutoScalerAddOn(),
  new ContainerInsightsAddOn(),
  new AwsLoadBalancerControllerAddOn(),
  // new VpcCniAddOn(),
  new CoreDnsAddOn(),
  // new KubeProxyAddOn(),
  // new XrayAddOn(),
  new KubecostAddOn(),
];

const fargateProfiles: Map<string, FargateProfileOptions> = new Map([
  ["custom", { selectors: [{ namespace: "default" }] }],
]);

const fargateClusterProvider = new FargateClusterProvider({
  fargateProfiles,
  version: KubernetesVersion.V1_22,
  vpc: vpcStack.vpc,
});

const sreTeam = new TeamSRE(app);
const viewOnlyTeam = new TeamViewOnly(app);

const blueprint = EksBlueprint.builder()
  .account(env.account)
  .region(env.region)
  .addOns(...addOns)
  .teams(sreTeam, viewOnlyTeam)
  // .clusterProvider(fargateClusterProvider)
  .resourceProvider(GlobalResources.Vpc, new DirectVpcProvider(vpcStack.vpc));

// TBD
//
CodePipelineStack.builder()
  .name("eks-blueprints-pipeline")
  .owner("aws-samples")
  .repository({
    repoUrl: "cdk-eks-blueprints-patterns",
    credentialsSecretName: "github-token",
    targetRevision: "main",
  });

const eksStack = blueprint.build(app, "eks-blueprint");
