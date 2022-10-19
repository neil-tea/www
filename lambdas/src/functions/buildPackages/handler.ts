import type { Package } from '@libs/types';
import _ from 'lodash';
import axios from 'axios';
import { compareVersions, validate } from 'compare-versions';

import S3 from 'aws-sdk/clients/s3';
import { base } from 'airtable';

// const atApiKey = 'keyKqvmHrsakIfqWg'; // set this to AIRTABLE_API_KEY env var

const  s3 = new S3();

const airtablePackagesBase = base(process.env.AIRTABLE_PACKAGES_BASE);

const Bucket = process.env.AWS_DIST_BUCKET;

interface S3Package {
  slug: string,
  version: string,
  full_name: string,
  name: string,
  maintainer: string,
  homepage: string,
  // key: string,
  last_modified: Date | string,
}

type AirtablePackage = S3Package & {
  airtable_record_id: string,
  thumb_image_url: string,
  description: string,
}

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
    const [
      allS3Packages,
      airtablePackages
    ] = await Promise.all([
      getAllS3Packages(),
      getAllAirtablePackages(),
    ]);

  } catch (error) {
    console.error(error);
  }
};


const getAllS3Packages = async (): Promise<S3Package[]>  => {
  const allS3PackagesWithDups = await getKeysFromS3();

  const sortedByVersion = allS3PackagesWithDups
    .sort((a, b) => compareVersions(a.version, b.version))
    .reverse();

  const uniquePackages = _(sortedByVersion)
    .uniqBy('name')
    .value();

  return uniquePackages;
}

const getKeysFromS3 = async (ContinuationToken?: string) : Promise<S3Package[]> => {
  const res = await s3.listObjectsV2({
    Bucket,
    MaxKeys: 2147483647,
    ...(ContinuationToken ? { ContinuationToken } : {}),
  }).promise();

  const s3Packages: S3Package[] = res.Contents
    .filter((data: S3.Object) => data.Key.split('/').length >= 2)
    .map(convertS3ContentTOS3Package);

  if (res.IsTruncated && res.NextContinuationToken) {
    const nextPackages = await getKeysFromS3(res.NextContinuationToken);
    s3Packages.push(...nextPackages);
  }

  return s3Packages.filter((p) => validate(p.version));
}

const convertS3ContentTOS3Package = (data: S3.Object) : S3Package => {
  const pathElements = data.Key.replace('github.com/', '').split('/');
  const [rawVersion] = pathElements.pop().split('.tar');
  const version = rawVersion.replace('v', '')
    .replace('.sha256sum','')
    .replace('ersions.txt', '');

  const [maintainerOrPackageName, packageName] = pathElements;
  const isMaintainer = !packageName ? false :
    !['linux','darwin'].includes(packageName);

  const fullName = isMaintainer ? [maintainerOrPackageName, packageName].join('/') : maintainerOrPackageName;

  return {
    slug: fullName.replace(/[^\w\s]/gi, '_').toLocaleLowerCase(),
    name: isMaintainer ? packageName : maintainerOrPackageName,
    full_name: fullName,
    maintainer: isMaintainer ? maintainerOrPackageName : '',
    version,
    last_modified: data.LastModified,
    homepage: getPossibleHomepage(maintainerOrPackageName) || getPossibleHomepage(packageName) || '' 
  }
}

const getPossibleHomepage = (name: string) => {
  return name && name.split('.').length > 1 ? `https://${name}` : ''
}

const writePackagesToS3 = async (packages: S3Package[]) => {
  console.log("uploading!")

  const buf = Buffer.from(JSON.stringify(packages));

  const data = {
      Bucket: 'dist.tea.xyz',
      Key: 'mock_packages.json',
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'application/json'
  };

  await s3.putObject(data).promise();
  console.log("uploaded!")
}

const getAllAirtablePackages = async () : Promise<AirtablePackage[]> => {
  const allRecords = await airtablePackagesBase('packages')
    .select({
      maxRecords: 100,
      view: '_api'
    }).all();
  
  const packages: AirtablePackage[] = allRecords.map((record) => {
    return {
      airtable_record_id: record.id,
      ..._.pick(record.fields, [
        'slug',
        'homepage',
        'maintainer',
        'name',
        'version',
        'last_modified',
        'full_name',
      ]),
      description: record.fields?.description || '',
      thumb_image_url: _.get(record.fields, 'thumb_image[0].url', '/Images/package-thumb-nolabel3.jpg')
    } as AirtablePackage;
  });
  /**
   * // SAMPLE RECORD SHAPE w/ thumb_image is uploaded
    {
      slug: 'unicode_org',
      name: 'unicode.org',
      full_name: 'unicode.org',
      homepage: 'https://unicode.org',
      version: '71.1.1',
      last_modified: '2022-09-26T19:46:25.000Z',
      thumb_image: [
        {
          id: 'attQVgaRUXOYinsWy',
          width: 640,
          height: 534,
          url: 'https://dl.airtable.com/.attachments/f2465c36a0060919368e2f53305694f9/cfab76a8/gen-art-1.png',
          filename: 'gen-art-1.png',
          size: 184878,
          type: 'image/png',
          thumbnails: [Object]
        }
      ]
    }
  TODO IMAGE UPLOAD to S3/CDN:
    if thumb_image_url is empty
      get thumb_image data
      upload to s3
      update thumb_image_url in airtable
   */
  return packages;
}

export const main = buildPackages;
