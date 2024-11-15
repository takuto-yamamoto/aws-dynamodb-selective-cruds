import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Database, Functions } from './constructs';
import { Api } from './constructs/api';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const db = new Database(this, 'Database');
    const functions = new Functions(this, 'Functions', {
      userTableName: db.usersTable.tableName,
    });
    new Api(this, 'CrudsApi', { functions });
  }
}
