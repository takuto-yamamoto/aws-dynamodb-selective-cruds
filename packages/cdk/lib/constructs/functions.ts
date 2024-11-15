import { Code, Function, IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

export type FunctionsProps = {
  userTableName: string;
};

export class Functions extends Construct {
  public readonly usersLambda: IFunction;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    this.usersLambda = new Function(this, 'usersLambda', {
      functionName: 'selective-cruds-lambda',
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname, '../../../cruds')),
      handler: 'index.handler',
      environment: {
        USER_TABLE: props.userTableName,
      },
    });
  }
}
