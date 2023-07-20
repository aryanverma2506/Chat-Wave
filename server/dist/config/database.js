import mongoose from "mongoose";
export default async function mongooseConnect() {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected ${conn.connection.name}`);
    }
    catch (error) {
        console.log(error);
    }
}
