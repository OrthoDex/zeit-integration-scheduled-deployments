## Resources

Redis keyspace for scheduled events.

Caveats: Events are not exact, redis polls internally + network call overheads and hence there can be delay in deployments.

## Repo Arrangement:

1. Now Integrations:

   - uiHooks/: contains files for UI integration
   - server/: files for the workers for oauth, registering deployments and connecting to redis
     - The server is a koa-ts app and each route is listed in now.json

2. listener:

   - simple micro app that runs a redis keyspace listener and sends webhooks to the integration endpoint when a key event is detected

3. Lib/: Common library used across the integration and the redis keyspace listener.

## Deployment:

### Deploy integration

`now --target=production`

This should also include a list of Environment Variables. All env variables needed are listed in `lib/commons.ts`.

### Deploy listener

`tsc && node dist/listener/index.js`

Same as above, this also needs the required Environment Variables.
