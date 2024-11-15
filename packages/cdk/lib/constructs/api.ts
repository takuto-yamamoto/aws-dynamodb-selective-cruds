import {
  Cors,
  EndpointType,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

import { Functions } from './functions';

export type ApiProps = {
  functions: Functions;
};

export class Api extends Construct {
  public readonly gateway: RestApi;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const restApiGateway = new RestApi(this, 'Gateway', {
      endpointTypes: [EndpointType.REGIONAL],
      restApiName: 'selective-cruds-api-gateway',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowHeaders: ['Content-Type'],
        allowMethods: ['GET', 'PATCH', 'OPTIONS'],
      },
      deployOptions: {
        stageName: 'dev',
      },
    });

    const usersResource = restApiGateway.root.addResource('users');
    const userIdResource = usersResource.addResource('{userId}');
    const usersIntegration = new LambdaIntegration(props.functions.usersLambda);
    userIdResource.addMethod('GET', usersIntegration);
    userIdResource.addMethod('PATCH', usersIntegration);

    this.gateway = restApiGateway;
  }
}
