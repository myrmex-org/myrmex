FROM alexisno/nodejs-dev:4.

USER root
RUN change-dev-id 1001
USER dev

RUN npm install -g mocha istanbul

RUN cd ~/.node/bin && ln -s ../lib/node_modules/lager/bin/lager lager

CMD ["npm", "test"]
