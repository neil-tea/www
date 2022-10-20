// import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [],
  environment: {
    AIRTABLE_API_KEY: '${ssm:/lambdas/airtable/api_key}',
    AIRTABLE_PACKAGES_BASE: '${ssm:/lambdas/airtable/packages_base}',
    AWS_DIST_BUCKET: '${ssm:/parameter/lambdas/dist_bucket}',
    ALGOLIA_APP_ID: '${ssm:/lambdas/algolia/app_id}',
    ALGOLIA_SEARCH_API_KEY: '${ssm:/lambdas/algolia/search_api_key}',
  }
};
