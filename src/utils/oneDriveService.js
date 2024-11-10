class OneDriveService {
  constructor() {
    this.initialized = false;
    this.config = {
      clientId: process.env.REACT_APP_ONEDRIVE_CLIENT_ID,
      redirectUri: window.location.origin,
      scopes: ["Files.Read", "Files.Read.All", "User.Read"]
    };
    this.accessToken = null;
    this.tokenExpiryTime = null;  // Track token expiry time
  }

  waitForOneDrive() {
    return new Promise((resolve) => {
      const checkOneDrive = () => {
        if (window.OneDrive) {
          resolve();
        } else {
          setTimeout(checkOneDrive, 100);
        }
      };
      checkOneDrive();
    });
  }

  async init() {
    if (this.initialized) return;

    try {
      await this.waitForOneDrive();
      this.initialized = true;
      return Promise.resolve();
    } catch (error) {
      console.error('Error initializing OneDrive:', error);
      throw error;
    }
  }

  // Check if access token is expired
  isAccessTokenExpired() {
    if (!this.tokenExpiryTime) return true;  // Token is not set or expired
    const currentTime = new Date().getTime();
    return currentTime >= this.tokenExpiryTime;
  }

  // Check if the user is already authorized
  isAuthorized() {
    return this.accessToken && !this.isAccessTokenExpired();
  }

  async authorize() {
    try {
      if (!this.initialized) {
        await this.init();
      }

      // Skip authorization if already authorized
      if (this.isAuthorized()) {
        console.log('Already authorized, skipping authorization...');
        return Promise.resolve();  // Resolve because the user is already authorized
      }

      // Proceed to authorization flow if not authorized
      return new Promise((resolve, reject) => {
        const options = {
          clientId: this.config.clientId,
          action: 'pick',
          multiSelect: true,
          success: (response) => {
            console.log('OneDrive response:', response);
            this.accessToken = response.accessToken;

            // Set the expiration time for the token (e.g., 1 hour from now)
            this.tokenExpiryTime = new Date().getTime() + response.expiresIn * 1000;

            resolve(response);
          },
          cancel: () => reject(new Error('User cancelled')),
          error: (error) => {
            console.error('OneDrive picker error:', error);
            reject(error);
          }
        };

        window.OneDrive.open(options);
      });
    } catch (error) {
      console.error('Error in OneDrive authorization:', error);
      throw error;
    }
  }

  async getFileDetails(fileId) {
    try {
      if (!this.accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting file details:', error);
      throw error;
    }
  }

  async loadDriveFiles(file) {
    try {
      console.log('Loading file:', file);
      
      // Get detailed file information first
      const fileDetails = await this.getFileDetails(file.id);
      console.log('File details:', fileDetails);

      const downloadUrl = fileDetails['@microsoft.graph.downloadUrl'];
      if (!downloadUrl) {
        throw new Error('Download URL not found for file: ' + fileDetails.name);
      }

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      return {
        blob,
        name: fileDetails.name,
        mimeType: fileDetails.file ? fileDetails.file.mimeType : 'application/octet-stream'
      };
    } catch (error) {
      console.error('Error loading file from OneDrive:', error);
      throw error;
    }
  }
}
    //eslint-disable-next-line
export default new OneDriveService();