import { get } from 'https';

export function getOAuthProfile<T>(url: string, accessToken: string) {
  return new Promise<T>((resolve, reject) => {
    const request = get(
      url,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if (!response.statusCode || response.statusCode >= 400) {
            reject(
              new Error(
                `OAuth profile request failed with status ${response.statusCode}`,
              ),
            );
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new Error('OAuth provider returned an invalid profile'));
          }
        });
      },
    );

    request.on('error', reject);
  });
}
