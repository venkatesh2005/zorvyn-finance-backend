require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\nFinance Backend running on http://localhost:${PORT}`);
    console.log(`📄 Environment: ${process.env.NODE_ENV}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  POST   /api/auth/register`);
    console.log(`  POST   /api/auth/login`);
    console.log(`  GET    /api/users`);
    console.log(`  GET    /api/records`);
    console.log(`  POST   /api/records`);
    console.log(`  GET    /api/dashboard/summary`);
    console.log(`  GET    /api/dashboard/trends\n`);
  });
});
