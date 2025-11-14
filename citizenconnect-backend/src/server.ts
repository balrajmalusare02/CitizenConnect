import { server } from "./app"; // Import the http server, not the express app
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // This is required for Render

server.listen(PORT, HOST, () => { // Use server.listen
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});