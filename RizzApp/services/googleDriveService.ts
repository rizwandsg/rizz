import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper';

interface DriveFile {
    id: string;
    name: string;
    mimeType?: string;
}

// Constants for Google Drive storage
const APP_FOLDER_NAME = 'RizzApp';
const MIME_TYPE = 'application/json';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

let drive: GDrive | null = null;
let isInitialized = false;

/**
 * Initialize Google Drive API
 */
export const initGoogleDrive = async (): Promise<void> => {
    if (isInitialized) return;
    
    try {
        await GoogleSignin.hasPlayServices();
        const { accessToken } = await GoogleSignin.getTokens();
        drive = new GDrive();
        drive.accessToken = accessToken;
        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
        throw new Error('Could not initialize Google Drive');
    }
};

/**
 * Find or create the app's folder in Google Drive
 */
export const findOrCreateAppFolder = async (): Promise<string> => {
    if (!drive || !isInitialized) {
        await initGoogleDrive();
    }

    const query = `name = '${APP_FOLDER_NAME}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;
    
    try {
        // First try to find the existing folder
        const result = await drive!.files.list({
            q: query,
            fields: 'files(id, name)'
        });

        const files = (result as any)?.files as DriveFile[];
        const existingFolder = files?.[0];

        if (existingFolder?.id) {
            return existingFolder.id;
        }

        // Create new folder if it doesn't exist
        const folderMetadata = {
            name: APP_FOLDER_NAME,
            mimeType: FOLDER_MIME_TYPE
        };

        const response = await drive!.files.newMetadataOnlyUploader()
            .setRequestBody(folderMetadata)
            .execute();

        const responseData = response as unknown as DriveFile;
        if (!responseData.id) {
            throw new Error('Failed to create folder');
        }

        return responseData.id;
    } catch (error) {
        console.error('Failed to find/create app folder:', error);
        throw new Error('Failed to access Google Drive folder');
    }
};

/**
 * Upload a file to Google Drive
 */
export const uploadFile = async (fileName: string, content: string, folderId: string): Promise<void> => {
    if (!drive || !isInitialized) {
        await initGoogleDrive();
    }

    const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;

    try {
        // Check if file exists
        const result = await drive!.files.list({
            q: query,
            fields: 'files(id)'
        });

        const files = (result as any)?.files as DriveFile[];
        const existingFile = files?.[0];

        // Create file metadata
        const fileMetadata = {
            name: fileName,
            mimeType: MIME_TYPE,
            parents: [folderId]
        };

        // Upload or update the file
        if (existingFile?.id) {
            await drive!.files.newMultipartUploader()
                .setRequestBody({
                    ...fileMetadata,
                    id: existingFile.id
                })
                .setData(content)
                .execute();
        } else {
            await drive!.files.newMultipartUploader()
                .setRequestBody(fileMetadata)
                .setData(content)
                .execute();
        }
    } catch (error) {
        console.error('Failed to upload file:', error);
        throw new Error('Failed to upload to Google Drive');
    }
};

/**
 * Download a file from Google Drive
 */
export const downloadFile = async (fileName: string, folderId: string): Promise<string | null> => {
    if (!drive || !isInitialized) {
        await initGoogleDrive();
    }

    const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;

    try {
        const result = await drive!.files.list({
            q: query,
            fields: 'files(id)'
        });

        const files = (result as any)?.files as DriveFile[];
        const file = files?.[0];

        if (!file?.id) {
            return null;
        }

        const response = await drive!.files.getBinary(file.id);
        return response ? response.toString() : null;
    } catch (error) {
        console.error('Failed to download file:', error);
        throw new Error('Failed to download from Google Drive');
    }
};