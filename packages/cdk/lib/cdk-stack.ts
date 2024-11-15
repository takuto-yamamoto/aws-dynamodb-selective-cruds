import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Api, Database, Functions } from './constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const database = new Database(this, 'Database');
    const functions = new Functions(this, 'Functions', { database });
    new Api(this, 'CrudsApi', { functions });
  }
}
