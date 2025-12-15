import { OpenAPIV3 } from "openapi-types";
import { Express } from "express"; //import kiểu express cho ap
import path from "path";
import fs from "fs";
import swaggerUi from 'swagger-ui-express'

type SwaggerSpec = OpenAPIV3.Document; //sử dụng kiểu OpenApi để kiểm tra type tốt hơn
const setupSwagger = (app: Express): void => {
  const swaggerFiles = [path.join(process.cwd(), "src/swagger/auth.json")];
  //khởi tạo đối tuong path rỗng
  let paths: OpenAPIV3.PathsObject = {};
  swaggerFiles.forEach((file) => {
    try {
      //dọc file và parse JSON
      const data = JSON.parse(fs.readFileSync(file, "utf-8")) as {
        paths: OpenAPIV3.PathsObject;
      };
      paths = { ...paths, ...data.paths };
    } catch (error) {
      // console.error(`Lỗi khi đọc hoặc parse file Swagger: ${file}`, error);
    }
  });
  const swaggerSpec: SwaggerSpec = {
    openapi: "3.0.0",
    info: { title: "API project", version: "1.0.0" },
    servers: [{ url: "http://localhost:5000" }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token", //ten cua cookie đó
        } as OpenAPIV3.ApiKeySecurityScheme, //ép kiểu swwaager ui cần các thuộc tính này
      },
      
    },
    // security: [{ cookieAuth: [] }],//bật cái này là bảo vệ hết á nha
    paths,
  };
  
  app.use('/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec,{
        swaggerOptions: {
            withCredentials: true///cho phép gửi cookie khi test api doc
        }
    })
  )
};

export default setupSwagger;
