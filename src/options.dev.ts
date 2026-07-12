import { reload } from './filters/reload';
import options from './options';

const filters = {...options.filters, ...{reload: reload(true)}};
const optionsDev = {...options, filters};

export default optionsDev;
