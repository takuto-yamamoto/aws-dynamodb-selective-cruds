import { userSchema } from './schemas';
import { dynamodbApi } from './dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { multiValueQueryStringParameters, pathParameters, httpMethod } =
      event;
    const fields = multiValueQueryStringParameters?.field ?? [];
    const userId = pathParameters?.userId!;

    const api = new dynamodbApi(process.env.USER_TABLE!);

    if (httpMethod === 'GET') {
      const user = await api.getUser(userId, fields);

      return {
        statusCode: 200,
        body: JSON.stringify(user),
      };
    } else if (httpMethod === 'PATCH') {
      const data = userSchema.partial().parse(JSON.parse(event.body!));

      await api.updateUser(userId, data, fields);

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
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'internal server error.' }),
    };
  }
};
