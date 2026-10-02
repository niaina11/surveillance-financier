import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  earlyAccess: true,
  schema: "./schema.prisma",
  migrate: {
    datasource: {
      url: process.env.DATABASE_URL!,
    },
  },
  client: {
    datasource: {
      url: process.env.DATABASE_URL!,
    },
  },
});