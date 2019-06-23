FROM node:alpine

LABEL "com.github.actions.name"="circleci-reporter"
LABEL "com.github.actions.description"="A GitHub App built with Probot that reports CircleCI build failures.."
LABEL "com.github.actions.icon"="code"
LABEL "com.github.actions.color"="gray-dark"

LABEL "repository"="https://github.com/botamic/circleci-reporter"
LABEL "homepage"="https://github.com/botamic/circleci-reporter"
LABEL "maintainer"="Brian Faust <hello@basecode.sh>"

ENV PATH=$PATH:/app/node_modules/.bin

WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn install --production
COPY . .

ENTRYPOINT ["probot"]
CMD ["run", "/app/index.js"]
