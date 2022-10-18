import { middyfy } from '@libs/lambda';

import type { Package } from '@libs/types';
import axios from 'axios';

import S3 from 'aws-sdk/clients/s3';
const  s3 = new S3();


const buildPackages = async (event) => {
  try {
    const {data} = await axios.get('https://mocki.io/v1/e289a4b4-3199-49f8-80a4-fcec70c74fdf');
    await writePackagesData(data);
  } catch (error) {
    console.error(error);
  }
};


const writePackagesData = async (packages: any[]) => {
  console.log("uploading!")

  const buf = Buffer.from(JSON.stringify(packages));

  const data = {
      Bucket: 'mockdist.tea.xyz',
      Key: 'packages.json',
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'application/json'
  };

  await s3.putObject(data).promise();
  console.log("uploaded!")
}

export const main = middyfy(buildPackages);
