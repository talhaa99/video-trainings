const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
const { loadEnvFiles } = require('./load-env')

async function run() {
  loadEnvFiles()
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.')
  }

  const migrationsDir = path.join(process.cwd(), 'db', 'migrations')
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(migrationPath, 'utf8')
      await client.query(sql)
      console.log(`Applied migration: ${file}`)
    }
    console.log('Database migrations completed successfully.')
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error('Migration failed:', error.message)
  process.exit(1)
})
