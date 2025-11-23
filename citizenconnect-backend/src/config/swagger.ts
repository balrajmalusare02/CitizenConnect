import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CitizenConnect API",
      version: "1.0.0",
      description: "API documentation for the CitizenConnect Grievance Redressal System",
      contact: {
        name: "CitizenConnect Team",
      },
    },
    servers: [
      {
        url: "https://citizenconnect-zbfh.onrender.com",
        description: "Production Server",
      },
      {
        url: "http://localhost:4000",
        description: "Local Development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Looks for annotations in your route files
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], 
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📄 Swagger Docs available at /api-docs");
};