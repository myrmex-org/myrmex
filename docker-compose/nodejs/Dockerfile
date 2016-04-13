FROM lagerjs/node-dev

USER root
RUN change-uid 1001
USER lager

RUN npm install -g mocha istanbul

RUN cd ~/.node/bin && ln -s ../lib/node_modules/lager/bin/lager lager

CMD ["npm", "test"]
