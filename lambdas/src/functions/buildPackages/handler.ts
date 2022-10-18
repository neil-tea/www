import { middyfy } from '@libs/lambda';

import type { Package } from '@libs/types';
import axios from 'axios';

import S3 from 'aws-sdk/clients/s3';
const  s3 = new S3();


const buildPackages = async () => {
  try {
    /**
     * 
     * const packages: Package[] = []
     * const insertToAirtable: Package[] = []
     * retrieve packages from IPFS
     * 
     * or 
     * 
     * retrieve from S3 keys
     *  construct name, and version
     * 
     * retrieve data from airtable
     *  check which packages have airtable match
     *  if AT.match
     *    packages.push(at.match)
     *  else 
     *    search algolia index for a match
     *      if algolia.match
     *        packages.push(transform algolia.match)
     *        insertToAirtable(transform algolia.match)
     *      else
     *        // Yup, dont included to packages to be displayed in site
     *        insertToAirtable();
     */
    const {data} = await axios.get('https://mocki.io/v1/e289a4b4-3199-49f8-80a4-fcec70c74fdf');
    await writePackagesToS3(data as Package[]);
  } catch (error) {
    console.error(error);
  }
};


const writePackagesToS3 = async (packages: Package[]) => {
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

export const main = buildPackages;
