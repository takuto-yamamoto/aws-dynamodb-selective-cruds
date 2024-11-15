import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { User } from './types';

export class dynamodbApi {
  private tableName: string;
  private client: DynamoDBDocumentClient;
  private readonly MAX_FIELD_DEPTH = 2;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient());
  }

  async getUser(userId: string, fields: string[] = []): Promise<Partial<User>> {
    const input: GetCommandInput = {
      TableName: this.tableName,
      Key: { id: userId },
    };

    if (fields.length > 0) {
      const { projectedFields, expressionAttributeNames } =
        this.getGetCommandFieldOptions(fields, this.MAX_FIELD_DEPTH);

      input.ProjectionExpression = projectedFields.join(', ');
      input.ExpressionAttributeNames = expressionAttributeNames;
    }

    const response = await this.client.send(new GetCommand(input));

    return response.Item as Partial<User>;
  }

  async updateUser(
    userId: string,
    data: Partial<User>,
    fields: string[] = []
  ): Promise<void> {
    const input: UpdateCommandInput = {
      TableName: this.tableName,
      Key: { id: userId },
      ConditionExpression: 'attribute_exists(id)',
    };

    const {
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    } = this.getUpdateCommandFieldOptions(data, fields, this.MAX_FIELD_DEPTH);
    input.UpdateExpression = updateExpression;
    input.ExpressionAttributeNames = expressionAttributeNames;
    input.ExpressionAttributeValues = expressionAttributeValues;

    await this.client.send(new UpdateCommand(input));
  }

  private inferFields(data: Record<string, any>, maxDepth: number) {
    const inferredFields: string[] = [];

    for (const [field, value] of Object.entries(data)) {
      if (value === undefined) continue;

      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value !== null &&
        maxDepth > 1
      ) {
        const nestedFields = this.inferFields(value, maxDepth - 1).map(
          (part) => `${field}.${part}`
        );
        inferredFields.push(...nestedFields);
      } else {
        inferredFields.push(field);
      }
    }

    return inferredFields;
  }

  private getNestedValue<T>(
    data: Record<string, any>,
    field: string
  ): T | undefined {
    const fieldParts = field.split('.');
    let targetValue: any = data;

    for (const fieldPart of fieldParts) {
      if (typeof targetValue !== 'object' || targetValue === null) {
        return undefined;
      }
      targetValue = targetValue[fieldPart];
    }

    return targetValue;
  }

  private getGetCommandFieldOptions(fields: string[], maxFieldDepth: number) {
    const expressionAttributeNames: Record<string, string> = {};
    const projectedFields = fields.map((field, i) => {
      const fieldParts = field.split('.').slice(0, maxFieldDepth);
      const placeholders = fieldParts.map((part, k) => {
        const placeholder = `#attr${i}-${k}`;
        expressionAttributeNames[placeholder] = part;
        return placeholder;
      });
      return placeholders.join('.');
    });

    return { expressionAttributeNames, projectedFields };
  }

  private getUpdateCommandFieldOptions(
    data: Record<string, any>,
    fields: string[],
    maxFieldDepth: number
  ) {
    let updateExpression = 'SET ';
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    let targetFields: string[];
    if (fields.length > 0) {
      targetFields = fields.map((field) =>
        field.split('.').slice(0, this.MAX_FIELD_DEPTH).join('.')
      );
    } else {
      targetFields = this.inferFields(data, this.MAX_FIELD_DEPTH);
    }

    updateExpression += targetFields
      .map((field, i) => {
        const valKey = `:val${i}`;
        const attrKeys = field.split('.').map((part, k) => {
          const attrKey = `#attr${i}-${k}`;
          expressionAttributeNames[attrKey] = part;
          return attrKey;
        });
        expressionAttributeValues[valKey] = this.getNestedValue(data, field);
        return `${attrKeys.join('.')} = ${valKey}`;
      })
      .join(', ');

    return {
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    };
  }
}
