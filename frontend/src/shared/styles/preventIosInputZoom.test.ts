import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from '@jest/globals';

import { preventIosInputZoom } from './preventIosInputZoom';

const SOURCE_ROOT = join(__dirname, '..', '..');
const STYLED_FIELD_PATTERN =
  /(?:export )?const (\w+) = styled\.(input|textarea|select)`([\s\S]*?)`;/g;

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return listSourceFiles(path);
    }

    return /\.(ts|tsx)$/.test(entry) && !/\.(test|stories)\.tsx?$/.test(entry)
      ? [path]
      : [];
  });
}

describe('preventIosInputZoom', () => {
  it('터치 기기에서 입력 글자를 16px로 올린다', () => {
    expect(preventIosInputZoom).toContain('@media (pointer: coarse)');
    expect(preventIosInputZoom).toContain('font-size: 16px');
  });

  it('화면에 보이는 모든 텍스트 입력칸이 iOS 확대 방지 규칙을 쓴다', () => {
    const fields = listSourceFiles(SOURCE_ROOT).flatMap((file) =>
      Array.from(readFileSync(file, 'utf8').matchAll(STYLED_FIELD_PATTERN))
        .filter(([, name]) => !name?.startsWith('Hidden'))
        .map(([, name, , body]) => ({
          id: `${relative(SOURCE_ROOT, file)}:${name}`,
          body: body ?? '',
        })),
    );
    const missing = fields
      .filter(({ body }) => !body.includes('${preventIosInputZoom}'))
      .map(({ id }) => id);

    expect(fields.length).toBeGreaterThanOrEqual(12);
    expect(missing).toEqual([]);
  });
});
