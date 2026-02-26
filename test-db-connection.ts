import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const clients = await prisma.client.findMany()
    console.log('Successfully connected to database and queried clients table.')
    console.log(`Found ${clients.length} clients.`)
  } catch (error) {
    console.error('Error querying database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
