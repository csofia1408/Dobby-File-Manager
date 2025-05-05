import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly storage: Storage;
  constructor() {
    const GCP_PROJECT_ID = 'winter-form-458923-n4';
    const GCP_KEY_FILE_PATH = 'key-gcp.json';

    this.storage = new Storage({
      projectId: GCP_PROJECT_ID,
      keyFilename: GCP_KEY_FILE_PATH,
    });
  }

  async uploadFileGcp() {
    const GCP_BUCKET = 'dobby-file-manager';
    const bucket = this.storage.bucket(GCP_BUCKET);
    const result = await bucket.upload(
      'C:\\Users\\csofi\\Documents\\Dobby-File-Manager\\files\\slide1.png',
    );
    return result;
  }
}
