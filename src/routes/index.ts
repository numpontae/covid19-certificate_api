
import { patient } from "./patient.routes";
import { auth } from "./auth.routes";
export class Routes {
  constructor(private app: any) {
    this.app = app;
  }

  setRoutes() {
    const prefix = "/api/v1";
    this.app.use(prefix + "/auth", auth);
    this.app.use(prefix + "/patient", patient);
  }
}
