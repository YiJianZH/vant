import { join } from 'path';
import { ROOT } from '../common/constant';
import { logger } from '../common/logger';
import { createWriteStream, readFileSync } from 'fs-extra';
// @ts-ignore
import conventionalChangelog from 'conventional-changelog';

const DIST_FILE = join(ROOT, './changelog.generated.md');
const MAIN_TEMPLATE = join(__dirname, '../../template/changelog-main.hbs');
const HEADER_TEMPALTE = join(__dirname, '../../template/changelog-header.hbs');
const COMMIT_TEMPALTE = join(__dirname, '../../template/changelog-commit.hbs');

const mainTemplate = readFileSync(MAIN_TEMPLATE, 'utf-8');
const headerPartial = readFileSync(HEADER_TEMPALTE, 'utf-8');
const commitPartial = readFileSync(COMMIT_TEMPALTE, 'utf-8');

function formatType(type: string) {
  const MAP: Record<string, string> = {
    fix: 'Bug Fixes',
    feat: 'Feature',
    docs: 'Document',
    types: 'Types'
  };

  return MAP[type] || type;
}

function transform(item: any) {
  if (item.type === 'chore' || item.type === 'test') {
    return null;
  }

  item.type = formatType(item.type);

  if (item.hash) {
    item.shortHash = item.hash.slice(0, 6);
  }

  if (item.references.length) {
    item.references.forEach((ref: any) => {
      if (ref.issue) {
        item.subject = item.subject.replace(` (#${ref.issue})`, '');
      }
    });
  }
  return item;
}

export async function changelog() {
  logger.start('Generating changelog...');

  return new Promise(resolve => {
    conventionalChangelog(
      {
        preset: 'angular'
      },
      null,
      null,
      null,
      {
        mainTemplate,
        headerPartial,
        commitPartial,
        transform
      }
    )
      .pipe(createWriteStream(DIST_FILE))
      .on('close', () => {
        logger.success(`Generated changelog at ${DIST_FILE}`);
        resolve();
      });
  });
}
