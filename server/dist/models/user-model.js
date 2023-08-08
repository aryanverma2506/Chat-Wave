import { Schema, model } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import bcrypt from "bcryptjs";
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: { type: String, required: true },
    profilePic: {
        type: String,
        default: "assets/profilePic/default-user-pic.png",
    },
}, { timestamps: true });
userSchema.plugin(uniqueValidator);
userSchema.pre("save", async function save(next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});
userSchema.methods.matchPassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};
const UserModel = model("User", userSchema);
export default UserModel;
