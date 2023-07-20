import mongoose from "mongoose";

export default async function mongooseConnect(): Promise<void> {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`MongoDB connected ${conn.connection.name}`);
  } catch (error: any) {
    console.log(error);
  }
}
