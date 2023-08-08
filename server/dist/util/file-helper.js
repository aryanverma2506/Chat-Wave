import fs from "fs/promises";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function deleteFile(filePath) {
    if (filePath) {
        try {
            await fs.unlink(path.join(__dirname, `../../${filePath}`));
        }
        catch (error) {
            console.log(error);
        }
    }
}
export async function deleteFolder(folderPath) {
    if (folderPath) {
        try {
            const files = await fs.readdir(path.join(__dirname, `../../${folderPath}`));
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = await fs.stat(filePath);
                if (stat.isDirectory()) {
                    // Recursively delete subdirectories
                    await deleteFolder(filePath);
                }
                else {
                    // Delete files
                    await fs.unlink(filePath);
                }
            }
            // After all files and subdirectories are deleted, remove the empty folder
            return fs.rmdir(path.join(__dirname, `../../${folderPath}`));
        }
        catch (error) {
            console.log(error);
        }
    }
}
