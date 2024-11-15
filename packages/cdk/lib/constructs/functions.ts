import * as path from 'path';

import { Duration } from 'aws-cdk-lib';
import { IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { Database } from './database';

export type FunctionsProps = {
  database: Database;
};

export class Functions extends Construct {
  public readonly usersLambda: IFunction;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const { usersTable } = props.database;

    const usersLambda = new NodejsFunction(this, 'usersLambda', {
      functionName: 'selective-cruds-lambda',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../cruds/index.ts'),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      timeout: Duration.seconds(29),
    });
    usersTable.grantReadWriteData(usersLambda);

    this.usersLambda = usersLambda;
  }
}
