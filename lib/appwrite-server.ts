import { Client, Storage, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

let client: Client;
let storage: Storage;

function getAppwriteClient() {
  if (!client) {
    if (
      !process.env.APPWRITE_ENDPOINT ||
      !process.env.APPWRITE_PROJECT_ID ||
      !process.env.APPWRITE_API_KEY
    ) {
      throw new Error("Missing Appwrite environment variables");
    }

    client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    storage = new Storage(client);
  }

  return { client, storage };
}

export async function uploadFile(file: Buffer, fileName: string) {
  const { storage } = getAppwriteClient();
  const bucketId = process.env.APPWRITE_BUCKET_ID!;

  const result = await storage.createFile(
    bucketId,
    ID.unique(),
    InputFile.fromBuffer(file, fileName),
  );

  const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${result.$id}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

  return { fileId: result.$id, fileUrl };
}

export async function deleteFile(fileId: string) {
  const { storage } = getAppwriteClient();
  const bucketId = process.env.APPWRITE_BUCKET_ID!;
  await storage.deleteFile(bucketId, fileId);
}

export async function getFilePreview(fileId: string) {
  const bucketId = process.env.APPWRITE_BUCKET_ID!;
  return `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
}
