// backend/lib/prisma.js
// Single shared PrismaClient instance — import this everywhere instead of
// creating new PrismaClient() in each controller. Prevents connection pool exhaustion.
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
