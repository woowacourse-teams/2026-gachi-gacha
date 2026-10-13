import { describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { storeAuthTokens } from '@/features/auth/authTokenStorage';
import { server } from '@/test/server';

import { uploadProfileImage } from './uploadProfileImage';

describe('uploadProfileImage', () => {
  it('인증된 multipart 요청으로 사진을 업로드하고 URL을 반환한다', async () => {
    let authorizationHeader: string | null = null;
    let uploadedFileName: string | null = null;

    server.use(
      http.post('/api/v1/files', async ({ request }) => {
        authorizationHeader = request.headers.get('Authorization');
        const formData = await request.formData();
        const uploadedFile = formData.get('files');
        uploadedFileName =
          uploadedFile instanceof File ? uploadedFile.name : null;

        return HttpResponse.json({
          code: 'C000',
          message: '요청에 성공했습니다.',
          data: {
            files: [
              {
                url: 'https://cdn.example.com/profile/uuid.png',
                originalName: 'profile.png',
                contentType: 'image/png',
                size: 7,
              },
            ],
          },
        });
      }),
    );
    storeAuthTokens({
      accessToken: 'profile-access-token',
      refreshToken: 'profile-refresh-token',
    });

    const result = await uploadProfileImage(
      new File(['profile'], 'profile.png', { type: 'image/png' }),
    );

    expect(authorizationHeader).toBe('Bearer profile-access-token');
    expect(uploadedFileName).toBe('profile.png');
    expect(result).toBe('https://cdn.example.com/profile/uuid.png');
  });

  it('업로드 실패 시 서버의 오류 메시지를 전달한다', async () => {
    server.use(
      http.post('/api/v1/files', () =>
        HttpResponse.json(
          {
            code: 'S3E03',
            message: '파일 업로드에 실패했습니다.',
            data: null,
          },
          { status: 500 },
        ),
      ),
    );
    storeAuthTokens({
      accessToken: 'profile-access-token',
      refreshToken: 'profile-refresh-token',
    });

    await expect(
      uploadProfileImage(
        new File(['profile'], 'profile.png', { type: 'image/png' }),
      ),
    ).rejects.toThrow('파일 업로드에 실패했습니다.');
  });
});
