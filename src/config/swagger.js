import dotenv from "dotenv";
import swaggerJSDoc from "swagger-jsdoc";

dotenv.config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CodeQuest Backend API",
      version: "1.0.0",
      description: "API documentation for CodeQuest Backend",
    },
    servers: [
      {
        url: `${process.env.BASE_URL}/api`,
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
