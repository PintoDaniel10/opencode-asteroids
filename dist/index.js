const core = require('@actions/core');

async function run() {
  try {
    const model = core.getInput('model');
    const apiKey = core.getInput('api-key');

    if (!apiKey) {
      throw new Error("Falta OPENCODE_API_KEY");
    }

    console.log(`Ejecutando modelo: ${model}`);
    core.setOutput('result', `Modelo ${model} ejecutado correctamente`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
