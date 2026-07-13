import mongoose from 'mongoose'

// Cache the connection across serverless invocations to avoid
// exhausting Atlas connection limits on cold starts.
let cached = globalThis._mongooseCache
if (!cached) cached = globalThis._mongooseCache = { conn: null, promise: null }

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set')
    cached.promise = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false })
  }
  cached.conn = await cached.promise
  return cached.conn
}
