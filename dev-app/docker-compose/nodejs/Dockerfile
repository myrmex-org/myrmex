FROM lager/node-dev

USER root
RUN change-uid 1001
USER ${USERNAME}

RUN npm install -g mocha istanbul

RUN cd ~/.node/bin && ln -s ../lib/node_modules/lager/bin/lager lager

CMD ["npm", "test"]
