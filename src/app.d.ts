interface Options {
    port: number;
}

class App {
    constructor(options: number | Options): void;
    async create(): Promise<void>;
    async start(port?: number): Promise<void>;
}

export default App;
