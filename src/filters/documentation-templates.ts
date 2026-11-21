import pug from 'pug';
import fs from 'node:fs';
import path from 'node:path';
import { pluginPath } from '../documentation-loader';

interface ComponentVariables {
  markdown: string;
  render: string;
  code: string;
}

interface RenderDocVariables {
  markdown: string;
  render: string;
}

interface TemplateVariables {
  markdown: string;
  render: string;
  code: string;
}

interface ComponentRenderVariables {
  src: string;
  height: string;
}

interface TemplateRenderVariables {
  src: string;
}

interface CodeVariables {
  htmlCode: string;
  pugCode: string;
  htmlRaw: string;
  pugRaw: string;
}

type Component = (variables: ComponentVariables) => string;
type ComponentRender = (variables: ComponentRenderVariables) => string;
type RenderDocPart = (variables: RenderDocVariables) => string;
type Template = (variables: TemplateVariables) => string;
type TemplateRender = (variables: TemplateRenderVariables) => string;
type Code = (variables: CodeVariables) => string;

const DOCUMENTATION_PART_DIRECTORY = path.resolve(
  pluginPath(),
  'part',
);

const RENDER_DOC_PART = path.resolve(DOCUMENTATION_PART_DIRECTORY, 'render-doc.pug');

export const component: Component = pug.compileFile(path.resolve(DOCUMENTATION_PART_DIRECTORY, 'component.pug'));
export const template: Template = pug.compileFile(path.resolve(DOCUMENTATION_PART_DIRECTORY, 'template.pug'));
export const componentRender: ComponentRender = pug.compileFile(path.resolve(DOCUMENTATION_PART_DIRECTORY, 'component-render.pug'));
export const templateRender: TemplateRender = pug.compileFile(path.resolve(DOCUMENTATION_PART_DIRECTORY, 'template-render.pug'));
export const code: Code = pug.compileFile(path.resolve(DOCUMENTATION_PART_DIRECTORY, 'code.pug'));
export const renderDocPart: RenderDocPart | undefined = fs.existsSync(RENDER_DOC_PART) ? pug.compileFile(RENDER_DOC_PART) : undefined;
