export interface StoredFile {
  url: string;
  filePath: string;
}

export interface StorageAdapter {
  upload(file: Buffer, relativePath: string, mimeType: string): Promise<StoredFile>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  deleteProjectDirectory(projectId: string): Promise<void>;
}

