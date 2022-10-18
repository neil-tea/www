// import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      httpApi: {
        method: 'put',
        path: '/hello2',
        // request: {
        //   schemas: {
        //     'application/json': schema,
        //   },
        // },
      },
    },
  ],
};
