const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const model = core.getInput('model');
    const apiKey = core.getInput('api-key');

    // Aquí iría tu lógica para conectar con OpenCode
    console.log(`Usando modelo: ${model}`);
    console.log(`API Key: ${apiKey ? '***' : 'No definida'}`);

    core.setOutput('result', `Modelo ${model} ejecutado correctamente`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
