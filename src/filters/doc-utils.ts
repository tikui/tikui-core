import fs from 'node:fs';
import path from 'node:path';
import pug from 'pug';
import {Marked} from 'marked';
import escapeHtml from "escape-html";
import { DocUtils, Render, Code } from './Documentation';
import {projectSrc} from '../tikui-loader';
import {toPosixPath} from '../path-util';
import {htmlToPug} from '@johnsoncodehk/html2pug';

const getCode = (filename: string) => (code: Code): string => {
  const codeFile = filename.replace(/.md$/, '.code.pug');

  if (!fs.existsSync(codeFile)) {
    return 'Please provide a code file: ' + codeFile;
  }

  const rendered = pug.renderFile(codeFile, {pretty: true, basedir: projectSrc});
  const escaped = escapeHtml(rendered).trim();
  const renderedPug = htmlToPug(rendered);
  const escapedPug = escapeHtml(renderedPug).trim();

  return code(escaped, escapedPug, rendered, renderedPug);
};

const getRender = (filename: string) => (template: Render): string => {
  const absoluteFilename =  path.resolve(filename);
  const renderFilename = absoluteFilename.replace(/.md$/, '.render.pug');
  const relativeRenderFilename = path.relative(projectSrc, renderFilename);

  if (!fs.existsSync(renderFilename)) {
    return 'Please provide a render file: ' + renderFilename;
  }

  const htmlFilenameLink = toPosixPath(relativeRenderFilename).replace(/^(.+).pug$/, '[[TIKUI_BASEPATH]]$1.html');

  return template(htmlFilenameLink);
};

const headingId = (text: string, counts: Map<string, number>): string => {
  const id = text.replace(/<[^>]*>/g, '').trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');
  const count = counts.get(id) ?? 0;
  counts.set(id, count + 1);

  return count === 0 ? id : `${id}-${count}`;
};

const getMarkdown = (str: string) => (): string => {
  const counts = new Map<string, number>();
  const marked = new Marked({
    renderer: {
      heading({tokens, depth}) {
        const id = headingId(this.parser.parseInline(tokens, this.parser.textRenderer), counts);

        return `<h${depth} id="${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });

  return marked.parse(str, {async: false});
};

export const docUtils = (str: string, filename: string): DocUtils => ({
  code: getCode(filename),
  render: getRender(filename),
  markdown: getMarkdown(str),
});
