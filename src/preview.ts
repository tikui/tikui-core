import express from 'express';
import cors from 'cors';
import {port, projectDist} from './tikui-loader';

const app = express();

app.use(cors());

// Serve dist directory
app.use('/', express.static(projectDist));

// Create server
app.listen(port, () => console.log(`Styles are available at http://localhost:${port}/`));
