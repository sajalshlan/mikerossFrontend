/* global gapi, google */

class GoogleDriveService {
  constructor() {
    this.initialized = false;
    this.accessToken = null;
    this.tokenClient = null;
    this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  }

  async init() {
    if (this.initialized && this.accessToken) return Promise.resolve(this.accessToken);

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly',  // or drive.file as needed
          callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
              this.accessToken = tokenResponse.access_token;
              this.initialized = true;
              resolve(this.accessToken);
            } else {
              reject(new Error('Failed to get access token'));
            }
          },
        });

        // Prompt the user to authorize if accessToken not present
        this.tokenClient.requestAccessToken();
      } catch (error) {
        console.error('Error initializing token client:', error);
        reject(error);
      }
    });
  }

  async authorize() {
    if (!this.initialized || !this.tokenClient) {
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
            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
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
    if (!this.accessToken) {
      throw new Error('Not authorized. Please call authorize() first.');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error loading file from Google Drive:', error);
      throw error;
    }
  }

  async exportGoogleDoc(fileId) {
    if (!this.accessToken) {
      throw new Error('Not authorized. Please call authorize() first.');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export file: ${response.statusText}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error exporting Google Doc:', error);
      throw error;
    }
  }
}

export default new GoogleDriveService();
