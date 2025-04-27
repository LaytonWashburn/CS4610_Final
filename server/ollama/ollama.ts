import { Ollama } from "ollama";

// Custom Ollama Client
const ollama = new Ollama({ host: process.env.OLLAMA_URL });

async function preloadModel() {
  // Pull the model (downloads it if not already pulled)
  await ollama.pull({ model: 'qwen2.5-coder', insecure: true });

  // Warm up the model by sending a dummy request
  await ollama.query({ 
    model: 'qwen2.5-coder', 
    prompt: 'This is a warm-up query to load tensors.' 
  });

  console.log("Model and tensors are preloaded!");
}

preloadModel().catch(console.error); // Preload the model to avoid cold start

export const getOllama = () => {
    return ollama;
};


// import { Ollama } from "ollama";

// // Custom Ollama Client
// const ollama = new Ollama({ host: process.env.OLLAMA_URL});
// ollama.pull({model: 'qwen2.5-coder', insecure: true});

// export const getOllama = () => {
//     return ollama;
// }
