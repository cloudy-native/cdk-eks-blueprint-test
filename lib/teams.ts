import { ApplicationTeam } from "@aws-quickstart/eks-blueprints";
import { App, Environment, Stack, StackProps } from "aws-cdk-lib";

export class TeamSRE extends ApplicationTeam {
  constructor(app: App) {
    super({
      name: "team-sre",
      users: [
        // new ArnPrincipal(`arn:aws:iam::${YOUR_IAM_ACCOUNT}:user/user1`),
        // new ArnPrincipal(`arn:aws:iam::${YOUR_IAM_ACCOUNT}:user/user2`)
      ],
    });
  }
}

export class TeamViewOnly extends ApplicationTeam {
  constructor(app: App) {
    super({
      name: "team-view-only",
      users: [
        // new ArnPrincipal(`arn:aws:iam::${YOUR_IAM_ACCOUNT}:user/user1`),
        // new ArnPrincipal(`arn:aws:iam::${YOUR_IAM_ACCOUNT}:user/user2`)
      ],
    });
  }
}
