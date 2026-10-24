import { createServer } from "http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`> Ready on port ${port}`);
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });