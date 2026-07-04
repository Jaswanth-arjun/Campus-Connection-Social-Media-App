import { sha256 } from 'js-sha256';

interface S3UploadOptions {
  uri: string;
  bucket: string;
  key: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  contentType: string;
}

/**
 * URI encode according to AWS specifications.
 */
function uriEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Get S3 Canonical URI. Slashes should not be encoded.
 */
function getCanonicalURI(key: string): string {
  return '/' + key.split('/').map(segment => uriEncode(segment)).join('/');
}

/**
 * Format date/time to ISO 8601 basic format.
 */
function getAmzDates(): { datetime: string; dateStamp: string } {
  const now = new Date();
  const datetime = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
  const dateStamp = datetime.slice(0, 8);
  return { datetime, dateStamp };
}

/**
 * Generate AWS Signature Version 4 signing key.
 */
function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): number[] {
  const kDate = sha256.hmac.create('AWS4' + key).update(dateStamp).array();
  const kRegion = sha256.hmac.create(kDate).update(regionName).array();
  const kService = sha256.hmac.create(kRegion).update(serviceName).array();
  const kSigning = sha256.hmac.create(kService).update('aws4_request').array();
  return kSigning;
}

/**
 * Upload a file directly to AWS S3 using pure JS fetch and Signature Version 4.
 * This completely avoids importing any heavy AWS SDK node-dependent packages.
 */
export async function uploadToS3(options: S3UploadOptions): Promise<string> {
  const { uri, bucket, key, region, accessKeyId, secretAccessKey, sessionToken, contentType } = options;

  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const url = `https://${host}/${key}`;

  const { datetime, dateStamp } = getAmzDates();

  // Define S3 headers
  const headers: Record<string, string> = {
    'host': host,
    'x-amz-acl': 'public-read',
    'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    'x-amz-date': datetime,
  };

  if (sessionToken) {
    headers['x-amz-security-token'] = sessionToken;
  }

  // Sort and canonicalize headers
  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map(k => `${k}:${headers[k].trim()}`)
    .join('\n') + '\n';

  const signedHeaders = sortedHeaderKeys.join(';');

  // Create canonical request
  const canonicalRequest = [
    'PUT',
    getCanonicalURI(key),
    '', // canonical query string (empty)
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  // Create string to sign
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const hashedCanonicalRequest = sha256(canonicalRequest);
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');

  // Generate signature
  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, 's3');
  const signature = sha256.hmac.create(signingKey).update(stringToSign).hex();

  // Assemble ultimate authorization header
  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Read binary data using expo-file-system
  // Using XMLHttpRequest is another option, but FileSystem is cleaner for base64 conversions
  const FileSystem = require('expo-file-system');
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  // Convert base64 to binary blob
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Send request using standard fetch
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'Authorization': authorizationHeader,
      'Content-Type': contentType,
    },
    body: bytes,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[s3Service] S3 direct upload failed:', errorText);
    throw new Error(`S3 upload responded with status ${response.status}: ${errorText}`);
  }

  return url;
}
