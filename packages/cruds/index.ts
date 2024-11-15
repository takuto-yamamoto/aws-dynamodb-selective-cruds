import { userSchema } from './schemas';
import { dynamodbApi } from './dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { Logger, LogLevel } from '@aws-lambda-powertools/logger';
import { ZodError } from 'zod';

const logger = new Logger({
  serviceName: 'dynamodb-selective-cruds',
  logLevel: LogLevel['DEBUG'],
});

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    const { multiValueQueryStringParameters, pathParameters, httpMethod } =
      event;
    const fields = multiValueQueryStringParameters?.field ?? [];
    const userId = pathParameters?.userId!;

    const api = new dynamodbApi(process.env.USERS_TABLE!, logger);

    logger.info('API処理開始', { httpMethod, context });
    if (httpMethod === 'GET') {
      const user = await api.getUser(userId, fields);

      logger.info('API処理完了');
      return {
        statusCode: 200,
        body: JSON.stringify(user),
      };
    } else if (httpMethod === 'PATCH') {
      const data = userSchema.partial().parse(JSON.parse(event.body!));

      await api.updateUser(userId, data, fields);

      logger.info('API処理完了');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'success' }),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'unknown http method.' }),
      };
    }
  } catch (error) {
    logger.info('API処理失敗', { error });
    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'invalid parameter.',
          issues: error.issues,
        }),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'internal server error.' }),
      };
    }
  }
};
