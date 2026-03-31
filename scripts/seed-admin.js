const bcrypt = require('bcryptjs')
const { Client } = require('pg')
const { loadEnvFiles } = require('./load-env')

async function run() {
  loadEnvFiles()
  const databaseUrl = process.env.DATABASE_URL
  const name = process.env.ADMIN_SEED_NAME || 'Platform Admin'
  const email = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD
  const role = process.env.ADMIN_SEED_ROLE || 'super_admin'

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.')
  }

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required.')
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    const existing = await client.query('SELECT id FROM admins WHERE email = $1 LIMIT 1', [email.toLowerCase()])

    if (existing.rowCount > 0) {
      console.log('Admin already exists. Seed skipped.')
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await client.query(
      `
        INSERT INTO admins (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
      `,
      [name, email.toLowerCase(), passwordHash, role]
    )

    console.log(`Seeded admin user: ${email.toLowerCase()}`)
  } finally {
    await client.end()
  }
}

run().catch((error) => {
  console.error('Admin seed failed:', error.message)
  process.exit(1)
})
