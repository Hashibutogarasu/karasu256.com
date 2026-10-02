FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g firebase-tools@15.32.1 --no-audit --no-fund
WORKDIR /firebase
COPY firebase.json .firebaserc ./
EXPOSE 9099
CMD ["firebase", "emulators:start", "--only", "auth"]
