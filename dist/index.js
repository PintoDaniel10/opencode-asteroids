const core = require('@actions/core');

async function run() {
  try {
    const model = core.getInput('model');
    const apiKey = core.getInput('api-key');

    if (!model) {
      throw new Error("Falta el input 'model'");
    }
    if (!apiKey) {
      throw new Error("Falta OPENCODE_API_KEY");
    }

    console.log(`Ejecutando modelo: ${model}`);

    // Simulación de respuesta externa
    const fakeResponse = '{ "result": "ok" }';
    let parsed;
    try {
      parsed = JSON.parse(fakeResponse);
    } catch {
      throw new Error("No se pudo parsear la respuesta como JSON");
    }

    if (!parsed.result) {
      throw new Error("La respuesta no contiene 'result'");
    }

    core.setOutput('result', `Modelo ${model} ejecutado correctamente: ${parsed.result}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
