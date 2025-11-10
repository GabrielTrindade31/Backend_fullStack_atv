import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend FullStack ATV',
      version: '1.0.0',
      description: 'API documentation'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  // Procura comentários JSDoc nas pastas de rotas/controllers
  apis: ['src/routes/**/*.ts', 'src/controllers/**/*.ts', 'src/**/*.route.ts', 'src/**/*.controller.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;