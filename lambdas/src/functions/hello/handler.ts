import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';

import AWS from 'aws-sdk/global';
import S3 from 'aws-sdk/clients/s3';
const  s3 = new S3();

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  await writeData();
  return formatJSONResponse({
    message: `Hello ${event.body.name}, welcome to the exciting Serverless world!`,
    event,
  });
};


const writeData = async () => {
  try {
    console.log("uploading!")

    const obj = {
        firstname: "Navjot",
        lastname: "Dhanawat"
    };
  
    const buf = Buffer.from(JSON.stringify(obj));
  
    const data = {
        Bucket: 'mockdist.tea.xyz',
        Key: 'packages.json',
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'application/json'
    };
  
    await s3.putObject(data).promise();
    console.log("uploaded!")
  } catch (error) {
    console.error(error);
  }
}

export const main = middyfy(hello);
