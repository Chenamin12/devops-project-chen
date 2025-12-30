const mongoose = require("mongoose")
const { MongoMemoryServer } = require("mongodb-memory-server")

let mongoServer

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
})

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})

// Teardown after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
})

// Mock environment variables
process.env.JWT_SECRET = "test-secret-key-for-jwt-tokens"
process.env.JWT_EXPIRE = "7d"
process.env.UPLOAD_PATH = "./tests/uploads"
process.env.MAX_FILE_SIZE = "5242880"

// Suppress console.error for expected errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})
