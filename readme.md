# nodexperts-glossary-alexa-skill
Search any JavaScript term from NodeXperts glossary


## Set up

- Install node-lambda package, `npm i -g node-lambda`
- `npm i --production` in the working directory
- Create `.env` and `deploy.env` files, follow format from `.env.sample` and `deploy.env.sample` files
- Run `npm run dev:lambda`

#### For local testing

- Create a `event.json` file from `event.json.example` and then run the lambda locally.

## Deploying

For deploying, refer deploy guide on [node-lambda](https://www.npmjs.com/package/node-lambda)

```
npm run dev:lambda-deploy
```