import type { Package, AirtablePackage, S3Package } from '@libs/types';
import _ from 'lodash';

import { getAllS3Packages, writePackagesToS3 } from '@libs/dist_tea_xyz';
import { getAllAirtablePackages } from '@libs/airtable';

type NewAirtablePackage = Partial<AirtablePackage>;


const buildPackages = async () => {
  try {
    const [
      allS3Packages,
      airtablePackages
    ] = await Promise.all([
      getAllS3Packages(),
      getAllAirtablePackages(),
    ]);

    const {
      newPackages,
      packagesJson,
    } = await getFinalPackagesData(allS3Packages, airtablePackages);

    await writePackagesToS3(packagesJson);
  } catch (error) {
    console.error(error);
  }
};

interface FinalPackageOutput {
  newPackages: NewAirtablePackage[],
  packagesJson: Package[],
}
interface AirtablePackageDict {
  [slug: string]: AirtablePackage
}
const getFinalPackagesData = async (s3Packages: S3Package[], airtablePackages: AirtablePackage[]): Promise<FinalPackageOutput> => {
  const newPackages: NewAirtablePackage[] = [];
  const packagesJson: Package[] = [];

  const airtablePackagesDict: AirtablePackageDict = airtablePackages.reduce(
    (dict: AirtablePackageDict, p: AirtablePackage) => {
      dict[p.slug] = p;
      return dict;
    },
    {}
  );

  for(const s3Package of s3Packages) {
    const airtablePackage = airtablePackagesDict[s3Package.slug];
    if (airtablePackage) {
      const finalPackage: Package = {
        ...airtablePackage,
        installs: 0, // temporary get this from tea db/ipfs eventually
        thumb_image_url: airtablePackage.thumb_image_url || '/Images/package-thumb-nolabel4.jpg',
      }
      packagesJson.push(finalPackage);
    } else {
      const newPackage: NewAirtablePackage = {
        ...s3Package,
        // TODO:
        desc: '', // get this from algolia
        homepage: s3Package.homepage || '', // get from algolia
      }
      const tempPackage: Package = {
        ...s3Package,
        thumb_image_url: '',
        desc: '',
        installs: 0,
      }
      newPackages.push(newPackage);
      packagesJson.push(tempPackage);
    }
  }

  return {
    newPackages,
    packagesJson,
  }
}


export const main = buildPackages;
