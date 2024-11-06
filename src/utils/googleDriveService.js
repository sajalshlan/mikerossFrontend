/* global gapi, google */

class GoogleDriveService {
  constructor() {
    this.initialized = false;
    this.accessToken = null;
    this.tokenClient = null;
    this.apiKey = 'AIzaSyCX7q-b7C4QwXuklvJOdLN5qmYFT77uTAc';
    this.clientId = '582627442016-bv7n3ntg4sglt625pdd4m7igmiei7f27.apps.googleusercontent.com';
  }

  async init() {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
          callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
              this.accessToken = tokenResponse.access_token;
              this.initialized = true;
              resolve(tokenResponse.access_token);
            } else {
              reject(new Error('Failed to get access token'));
            }
          },
        });
      } catch (error) {
        console.error('Error initializing token client:', error);
        reject(error);
      }
    });
  }

  async authorize() {
    try {
      if (!this.tokenClient) {
        await this.init();
      }
      
      return new Promise((resolve) => {
        this.tokenClient.callback = (response) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            resolve(response.access_token);
          }
        };
        
        if (this.accessToken) {
          resolve(this.accessToken);
        } else {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
      });
    } catch (error) {
      console.error('Authorization error:', error);
      throw error;
    }
  }

  async createPicker(callback) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please call authorize() first.');
    }

    return new Promise((resolve, reject) => {
      try {
        gapi.load('picker', () => {
          const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(this.accessToken)
            .setDeveloperKey(this.apiKey)
            .setCallback(callback)
            .build();
          resolve(picker);
        });
      } catch (error) {
        console.error('Error creating picker:', error);
        reject(error);
      }
    });
  }

  async loadDriveFiles(file) {
    console.log('accessToken', this.accessToken);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      }
    );
    return await response.blob();
  }
}

export default new GoogleDriveService();
