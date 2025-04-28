import { Ollama } from "ollama";

// Custom Ollama Client
const ollama = new Ollama({ 
    host: process.env.OLLAMA_URL || 'http://localhost:11434' 
});

// Synchronously pull the model
console.log("Pulling model qwen2.5-coder...");
ollama.pull({ 
    model: 'qwen2.5-coder', 
    insecure: true 
}).then(() => {
    console.log("Model pulled successfully");
    preloadModel().catch(console.error);
}).catch(error => {
    console.error("Failed to pull model:", error);
    process.exit(1);
});

export const getOllama = () => {
    return ollama;
};

export async function preloadModel() {
    try {
        console.log("Starting model preload...");
        
        // Warm up the model by sending a dummy request
        const response = await ollama.chat({
            model: 'qwen2.5-coder',
            messages: [{ role: 'user', content: 'This is a warm-up query to load tensors.' }],
        });

        console.log("Model and tensors are preloaded successfully!");
        return true;
    } catch (error) {
        console.error("Error preloading model:", error);
        throw error;
    }
}





// import { Ollama } from "ollama";

// // Custom Ollama Client
// const ollama = new Ollama({ host: process.env.OLLAMA_URL});
// ollama.pull({model: 'qwen2.5-coder', insecure: true});

// export const getOllama = () => {
//     return ollama;
// }