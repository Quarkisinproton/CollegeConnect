# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (better caching)
RUN mvn dependency:go-offline -B || true
COPY src ./src
# Build with retries and force updates
RUN mvn clean package -DskipTests -U -B || \
    (sleep 5 && mvn clean package -DskipTests -U -B) || \
    (sleep 10 && mvn clean package -DskipTests -U -B)

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-jar","app.jar"]
