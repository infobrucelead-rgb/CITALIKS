import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Intentando conectar a la base de datos...')
        // Simplemente intentamos una consulta básica, incluso si la tabla no existe, 
        // Prisma nos dirá si al menos se conectó.
        const result = await prisma.$queryRaw`SELECT 1`
        console.log('¡Conexión exitosa!', result)
    } catch (e: any) {
        console.error('Error de conexión:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
