import { GoogleSignin } from '@react-native-google-signin/google-signin';import { GoogleSignin } from '@react-native-google-signin/google-signin';import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper';

import Constants from 'expo-constants';import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper';import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper';



// Interface for exported functionsimport Constants from 'expo-constants';import Constants from 'expo-constants';

export interface GoogleDriveService {

    initGoogleDrive: () => Promise<void>;

    findOrCreateAppFolder: () => Promise<string>;

    uploadFile: (fileName: string, content: string, folderId: string) => Promise<void>;// Interface for exported functionsinterface DriveFile {

    downloadFile: (fileName: string, folderId: string) => Promise<string | null>;

}export interface GoogleDriveService {    id: string;



interface DriveFile {    initGoogleDrive: () => Promise<void>;    name: string;

    id: string;

    name: string;    findOrCreateAppFolder: () => Promise<string>;    mimeType?: string;

    mimeType?: string;

}    uploadFile: (fileName: string, content: string, folderId: string) => Promise<void>;}



// Configuration from environment variables    downloadFile: (fileName: string, folderId: string) => Promise<string | null>;

const CONFIG = {

    clientId: Constants.expoConfig?.extra?.googleDriveClientId as string,}// Configuration from environment variables

    scopes: [Constants.expoConfig?.extra?.googleDriveScopes || 'https://www.googleapis.com/auth/drive.file'],

    apiKey: Constants.expoConfig?.extra?.googleDriveApiKey as string,const CONFIG = {

    appFolder: Constants.expoConfig?.extra?.googleDriveAppFolder || 'RizzApp'

};interface DriveFile {    clientId: Constants.expoConfig?.extra?.googleDriveClientId as string,



// Constants for Google Drive storage    id: string;    scopes: [Constants.expoConfig?.extra?.googleDriveScopes || 'https://www.googleapis.com/auth/drive.file'],

const MIME_TYPE = 'application/json';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';    name: string;    apiKey: Constants.expoConfig?.extra?.googleDriveApiKey as string,



// Maximum retry attempts for operations    mimeType?: string;    appFolder: Constants.expoConfig?.extra?.googleDriveAppFolder || 'RizzApp'

const MAX_RETRIES = 3;

const RETRY_DELAY = 1000; // 1 second}};



// Shared state for Google Drive

let gdrive: GDrive | null = null;

let isInitialized = false;// Configuration from environment variables// Constants for Google Drive storage



/**const CONFIG = {const MIME_TYPE = 'application/json';

 * Initialize Google Drive API

 */    clientId: Constants.expoConfig?.extra?.googleDriveClientId as string,const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    scopes: [Constants.expoConfig?.extra?.googleDriveScopes || 'https://www.googleapis.com/auth/drive.file'],

const retryOperation = async <T>(

    operation: () => Promise<T>,    apiKey: Constants.expoConfig?.extra?.googleDriveApiKey as string,// Maximum retry attempts for operations

    retryCount = MAX_RETRIES

): Promise<T> => {    appFolder: Constants.expoConfig?.extra?.googleDriveAppFolder || 'RizzApp'const MAX_RETRIES = 3;

    for (let i = 0; i < retryCount; i++) {

        try {};const RETRY_DELAY = 1000; // 1 second

            return await operation();

        } catch (error) {

            if (i === retryCount - 1) throw error;

            await delay(RETRY_DELAY * Math.pow(2, i)); // Exponential backoff// Constants for Google Drive storage// Shared state for Google Drive

        }

    }const MIME_TYPE = 'application/json';let gdrive: GDrive | null = null;

    throw new Error('Operation failed after max retries');

};const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';let isInitialized = false;



// Create and export instance of GoogleDriveService

export const googleDrive: GoogleDriveService = {

    initGoogleDrive: async () => {// Maximum retry attempts for operations/**

        if (isInitialized) return;

        const MAX_RETRIES = 3; * Initialize Google Drive API

        try {

            // Configure Google Sign-inconst RETRY_DELAY = 1000; // 1 second */

            GoogleSignin.configure({

                scopes: CONFIG.scopes,const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

                webClientId: CONFIG.clientId,

                offlineAccess: true// Shared state for Google Drive

            });

let gdrive: GDrive | null = null;// Create and export instance of GoogleDriveService

            await retryOperation(async () => {

                await GoogleSignin.hasPlayServices();let isInitialized = false;export const googleDriveService: GoogleDriveService = {

                const { accessToken } = await GoogleSignin.getTokens();

                gdrive = new GDrive();    initGoogleDrive: async () => {

                gdrive.accessToken = accessToken;

                isInitialized = true;/**        if (isInitialized) return;

            });

        } catch (error) { * Initialize Google Drive API        

            console.error('Failed to initialize Google Drive:', error);

            throw new Error('Could not initialize Google Drive'); */        try {

        }

    },const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));            // Configure Google Sign-in

    findOrCreateAppFolder: async () => {

        if (!gdrive || !isInitialized) {            GoogleSignin.configure({

            await googleDrive.initGoogleDrive();

        }const retryOperation = async <T>(                scopes: CONFIG.scopes,



        const query = `name = '${CONFIG.appFolder}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;    operation: () => Promise<T>,                webClientId: CONFIG.clientId,

        

        try {    retryCount = MAX_RETRIES                offlineAccess: true

            return await retryOperation(async () => {

                // First try to find the existing folder): Promise<T> => {            });

                const result = await gdrive!.files.list({

                    q: query,    for (let i = 0; i < retryCount; i++) {

                    fields: 'files(id, name)'

                });        try {            await retryOperation(async () => {



                const files = (result as any)?.files as DriveFile[];            return await operation();                await GoogleSignin.hasPlayServices();

                const existingFolder = files?.[0];

        } catch (error) {                const { accessToken } = await GoogleSignin.getTokens();

                if (existingFolder?.id) {

                    return existingFolder.id;            if (i === retryCount - 1) throw error;                gdrive = new GDrive();

                }

            await delay(RETRY_DELAY * Math.pow(2, i)); // Exponential backoff                gdrive.accessToken = accessToken;

                // Create new folder if it doesn't exist

                const folderMetadata = {        }                isInitialized = true;

                    name: CONFIG.appFolder,

                    mimeType: FOLDER_MIME_TYPE    }            });

                };

    throw new Error('Operation failed after max retries');        } catch (error) {

                const response = await gdrive!.files.newMetadataOnlyUploader()

                    .setRequestBody(folderMetadata)};            console.error('Failed to initialize Google Drive:', error);

                    .execute();

            throw new Error('Could not initialize Google Drive');

                const responseData = response as unknown as DriveFile;

                if (!responseData.id) {// Create and export instance of GoogleDriveService        }

                    throw new Error('Failed to create folder');

                }export const googleDriveService: GoogleDriveService = {    },



                return responseData.id;    initGoogleDrive: async () => {    findOrCreateAppFolder: async () => {

            });

        } catch (error) {        if (isInitialized) return;        if (!gdrive || !isInitialized) {

            console.error('Failed to find/create app folder:', error);

            throw new Error('Failed to access Google Drive folder');                    await googleDriveService.initGoogleDrive();

        }

    },        try {        }

    uploadFile: async (fileName: string, content: string, folderId: string) => {

        if (!gdrive || !isInitialized) {            // Configure Google Sign-in

            await googleDrive.initGoogleDrive();

        }            GoogleSignin.configure({        const query = `name = '${CONFIG.appFolder}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;



        const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;                scopes: CONFIG.scopes,        



        try {                webClientId: CONFIG.clientId,        try {

            // Check if file exists

            const result = await gdrive!.files.list({                offlineAccess: true            return await retryOperation(async () => {

                q: query,

                fields: 'files(id)'            });                // First try to find the existing folder

            });

                const result = await gdrive!.files.list({

            const files = (result as any)?.files as DriveFile[];

            const existingFile = files?.[0];            await retryOperation(async () => {                    q: query,



            // Create file metadata                await GoogleSignin.hasPlayServices();                    fields: 'files(id, name)'

            const fileMetadata = {

                name: fileName,                const { accessToken } = await GoogleSignin.getTokens();                });

                mimeType: MIME_TYPE,

                parents: [folderId]                gdrive = new GDrive();

            };

                gdrive.accessToken = accessToken;                const files = (result as any)?.files as DriveFile[];

            // Upload or update the file

            if (existingFile?.id) {                isInitialized = true;                const existingFolder = files?.[0];

                await gdrive!.files.newMultipartUploader()

                    .setRequestBody({            });

                        ...fileMetadata,

                        id: existingFile.id        } catch (error) {                if (existingFolder?.id) {

                    })

                    .setData(content)            console.error('Failed to initialize Google Drive:', error);                    return existingFolder.id;

                    .execute();

            } else {            throw new Error('Could not initialize Google Drive');                }

                await gdrive!.files.newMultipartUploader()

                    .setRequestBody(fileMetadata)        }

                    .setData(content)

                    .execute();    },                // Create new folder if it doesn't exist

            }

        } catch (error) {    findOrCreateAppFolder: async () => {                const folderMetadata = {

            console.error('Failed to upload file:', error);

            throw new Error('Failed to upload to Google Drive');        if (!gdrive || !isInitialized) {                    name: CONFIG.appFolder,

        }

    },            await googleDriveService.initGoogleDrive();                    mimeType: FOLDER_MIME_TYPE

    downloadFile: async (fileName: string, folderId: string) => {

        if (!gdrive || !isInitialized) {        }                };

            await googleDrive.initGoogleDrive();

        }



        const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;        const query = `name = '${CONFIG.appFolder}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;                const response = await gdrive!.files.newMetadataOnlyUploader()



        try {                            .setRequestBody(folderMetadata)

            const result = await gdrive!.files.list({

                q: query,        try {                    .execute();

                fields: 'files(id)'

            });            return await retryOperation(async () => {



            const files = (result as any)?.files as DriveFile[];                // First try to find the existing folder                const responseData = response as unknown as DriveFile;

            const file = files?.[0];

                const result = await gdrive!.files.list({                if (!responseData.id) {

            if (!file?.id) {

                return null;                    q: query,                    throw new Error('Failed to create folder');

            }

                    fields: 'files(id, name)'                }

            const response = await gdrive!.files.getBinary(file.id);

            return response ? response.toString() : null;                });

        } catch (error) {

            console.error('Failed to download file:', error);                return responseData.id;

            throw new Error('Failed to download from Google Drive');

        }                const files = (result as any)?.files as DriveFile[];            });

    }

};                const existingFolder = files?.[0];        } catch (error) {

            console.error('Failed to find/create app folder:', error);

                if (existingFolder?.id) {            throw new Error('Failed to access Google Drive folder');

                    return existingFolder.id;        }

                }    },

    uploadFile: async (fileName: string, content: string, folderId: string) => {

                // Create new folder if it doesn't exist        if (!gdrive || !isInitialized) {

                const folderMetadata = {            await googleDriveService.initGoogleDrive();

                    name: CONFIG.appFolder,        }

                    mimeType: FOLDER_MIME_TYPE

                };        const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;



                const response = await gdrive!.files.newMetadataOnlyUploader()        try {

                    .setRequestBody(folderMetadata)            // Check if file exists

                    .execute();            const result = await gdrive!.files.list({

                q: query,

                const responseData = response as unknown as DriveFile;                fields: 'files(id)'

                if (!responseData.id) {            });

                    throw new Error('Failed to create folder');

                }            const files = (result as any)?.files as DriveFile[];

            const existingFile = files?.[0];

                return responseData.id;

            });            // Create file metadata

        } catch (error) {            const fileMetadata = {

            console.error('Failed to find/create app folder:', error);                name: fileName,

            throw new Error('Failed to access Google Drive folder');                mimeType: MIME_TYPE,

        }                parents: [folderId]

    },            };

    uploadFile: async (fileName: string, content: string, folderId: string) => {

        if (!gdrive || !isInitialized) {            // Upload or update the file

            await googleDriveService.initGoogleDrive();            if (existingFile?.id) {

        }                await gdrive!.files.newMultipartUploader()

                    .setRequestBody({

        const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;                        ...fileMetadata,

                        id: existingFile.id

        try {                    })

            // Check if file exists                    .setData(content)

            const result = await gdrive!.files.list({                    .execute();

                q: query,            } else {

                fields: 'files(id)'                await gdrive!.files.newMultipartUploader()

            });                    .setRequestBody(fileMetadata)

                    .setData(content)

            const files = (result as any)?.files as DriveFile[];                    .execute();

            const existingFile = files?.[0];            }

        } catch (error) {

            // Create file metadata            console.error('Failed to upload file:', error);

            const fileMetadata = {            throw new Error('Failed to upload to Google Drive');

                name: fileName,        }

                mimeType: MIME_TYPE,    },

                parents: [folderId]    downloadFile: async (fileName: string, folderId: string) => {

            };        if (!gdrive || !isInitialized) {

            await googleDriveService.initGoogleDrive();

            // Upload or update the file        }

            if (existingFile?.id) {

                await gdrive!.files.newMultipartUploader()        const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;

                    .setRequestBody({

                        ...fileMetadata,        try {

                        id: existingFile.id            const result = await gdrive!.files.list({

                    })                q: query,

                    .setData(content)                fields: 'files(id)'

                    .execute();            });

            } else {

                await gdrive!.files.newMultipartUploader()            const files = (result as any)?.files as DriveFile[];

                    .setRequestBody(fileMetadata)            const file = files?.[0];

                    .setData(content)

                    .execute();            if (!file?.id) {

            }                return null;

        } catch (error) {            }

            console.error('Failed to upload file:', error);

            throw new Error('Failed to upload to Google Drive');            const response = await gdrive!.files.getBinary(file.id);

        }            return response ? response.toString() : null;

    },        } catch (error) {

    downloadFile: async (fileName: string, folderId: string) => {            console.error('Failed to download file:', error);

        if (!gdrive || !isInitialized) {            throw new Error('Failed to download from Google Drive');

            await googleDriveService.initGoogleDrive();        }

        }    }

};

        const query = `name = '${fileName}' and '${folderId}' in parents and trashed = false`;

const retryOperation = async <T>(

        try {    operation: () => Promise<T>,

            const result = await gdrive!.files.list({    retryCount = MAX_RETRIES

                q: query,): Promise<T> => {

                fields: 'files(id)'    for (let i = 0; i < retryCount; i++) {

            });        try {

            return await operation();

            const files = (result as any)?.files as DriveFile[];        } catch (error) {

            const file = files?.[0];            if (i === retryCount - 1) throw error;

            await delay(RETRY_DELAY * Math.pow(2, i)); // Exponential backoff

            if (!file?.id) {        }

                return null;    }

            }    throw new Error('Operation failed after max retries');

};

            const response = await gdrive!.files.getBinary(file.id);

            return response ? response.toString() : null;// Interface for exported functions

        } catch (error) {export interface GoogleDriveService {

            console.error('Failed to download file:', error);    initGoogleDrive: () => Promise<void>;

            throw new Error('Failed to download from Google Drive');    findOrCreateAppFolder: () => Promise<string>;

        }    uploadFile: (fileName: string, content: string, folderId: string) => Promise<void>;

    }    downloadFile: (fileName: string, folderId: string) => Promise<string | null>;

};}

// Initialize Google Drive API
const initGoogleDrive = async (): Promise<void> => {
    if (isInitialized) return;
    
    try {
        // Configure Google Sign-in
        GoogleSignin.configure({
            scopes: CONFIG.scopes,
            webClientId: CONFIG.clientId,
            offlineAccess: true
        });

        await retryOperation(async () => {
            await GoogleSignin.hasPlayServices();
            const { accessToken } = await GoogleSignin.getTokens();
            drive = new GDrive();
            drive.accessToken = accessToken;
            isInitialized = true;
        });
    } catch (error) {
        console.error('Failed to initialize Google Drive:', error);
        throw new Error('Could not initialize Google Drive');
    }
};

/**
 * Find or create the app's folder in Google Drive
 */
const findOrCreateAppFolder = async (): Promise<string> => {
    if (!drive || !isInitialized) {
        await initGoogleDrive();
    }

    const query = `name = '${CONFIG.appFolder}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`;
    
    try {
        return await retryOperation(async () => {
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
                name: CONFIG.appFolder,
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
        });
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