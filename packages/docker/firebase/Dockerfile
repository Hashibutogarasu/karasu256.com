FROM eclipse-temurin:21-jre AS jre

FROM node:22-bookworm-slim
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"
COPY --from=jre /opt/java/openjdk /opt/java/openjdk
RUN npm install -g firebase-tools@15.32.1 --no-audit --no-fund
WORKDIR /firebase
COPY firebase.json .firebaserc ./
EXPOSE 9099
CMD ["firebase", "emulators:start", "--only", "auth"]
