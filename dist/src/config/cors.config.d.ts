export declare const corsConfig: {
    getOptions: () => {
        origin: boolean | string[];
        methods: string;
        credentials: boolean;
        allowedHeaders: string;
        preflightContinue: boolean;
        optionsSuccessStatus: number;
    };
};
