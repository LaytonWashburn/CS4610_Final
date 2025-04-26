import * as Minio from 'minio'

// Initialize the MinIO client
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

// Export a function to access the MinIO client
export const getMinioClient = () => {
    return minioClient;
}

// Create the bucket for the profile
export const createMinioProfileBucket = async (minioClient: Minio.Client) => {
    const bucket = 'profile'
    // Check if the bucket exists
    // If it doesn't, create it
    const exists = await minioClient.bucketExists(bucket);
    if (exists) {
    console.log('Bucket ' + bucket + ' exists.')
    } else {
    await minioClient.makeBucket(bucket, 'us-east-1')
    console.log('Bucket ' + bucket + ' created in "us-east-1".')
    }
}
