import express from 'express';
import cors from 'cors';
import router from './router';
class App {
    public app: express.Application;
    private setConfig(): void{
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
    }
    constructor(){
        this.app = express();
        this.setConfig();
        router(this.app);
    }
}

export default new App().app;