import { D1ProjectStore } from "./api/d1-project-store.ts";
import {
  createDevelopmentBearerAuthenticator,
  createProjectApi,
} from "./api/http.ts";
import { ProjectService } from "./api/project-service.ts";

export type WorkerEnvironment = {
  DB: D1Database;
  SKETCHY_API_TOKEN: string;
  SKETCHY_USER_ID: string;
};

export function handleRequest(
  request: Request,
  environment: WorkerEnvironment,
) {
  const service = new ProjectService(new D1ProjectStore(environment.DB));
  const authenticate = createDevelopmentBearerAuthenticator(
    environment.SKETCHY_API_TOKEN,
    environment.SKETCHY_USER_ID,
  );
  return createProjectApi(service, authenticate)(request);
}

export default {
  fetch: handleRequest,
} satisfies ExportedHandler<WorkerEnvironment>;
