import { docUtils } from './doc-utils';
import { ComponentOptions } from './Documentation';
import { componentRender } from './component-doc';
import * as documentationTemplates from './documentation-templates';

export const renderDoc = (str: string, opts: ComponentOptions): string => {
  const util = docUtils(str, opts.filename);
  const height = opts.height || '150';
  const markdown = util.markdown();
  const render = util.render(componentRender(height));
  if (documentationTemplates.renderDocPart) {
    return documentationTemplates.renderDocPart({ markdown, render });
  }
  return documentationTemplates.component({ markdown, render, code: '' });
};
