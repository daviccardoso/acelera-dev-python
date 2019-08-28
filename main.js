const {
  fs,
  hash,
  axios,
  token,
  caminho,
  request,
  alfabeto,
  readFileAsync,
  writeFileAsync
} = require('./index.js');

async function requisitarDadosAPI() {
  const resposta = await axios
    .get(`https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`);

  await gravarArquivo(resposta.data);
}

async function gravarArquivo(dados) {
  await writeFileAsync(caminho, JSON.stringify(dados));
}

async function lerArquivo() {
  const conteudo = await readFileAsync(caminho);

  return JSON.parse(conteudo.toString());
}

async function apurarDados(dados) {
  const { cifrado, numero_casas } = dados;
  const decifrado = decifrarTexto(cifrado, numero_casas);
  const resumo_criptografico = gerarHashSHA1(decifrado);

  await gravarArquivo({ ...dados, decifrado, resumo_criptografico });
}

function decifrarTexto(textoCifrado, numeroCasas) {
  return [...textoCifrado].reduce((acumulador, atual) => {
    const indice = alfabeto.indexOf(atual);

    acumulador += indice !== -1 ? alfabeto.slice(indice - numeroCasas)[0] : atual;

    return acumulador;
  }, '');
}

function gerarHashSHA1(textoDecifrado) {
  return hash.update(textoDecifrado).digest('hex');
}

function publicarArquivoDecifrado() {
  const dadosRequisicao = {
    method: 'POST',
    url: `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`,
    headers: { 'Content-Type': 'multipart/form-data' },
    formData: { 'answer': fs.createReadStream(caminho) }
  };

  request(dadosRequisicao, (erro, resposta) => {
    if (erro) console.error(erro);
    console.log(resposta.body);
  });
}

requisitarDadosAPI()
  .then(() => lerArquivo())
  .then(dados => apurarDados(dados))
  .then(() => publicarArquivoDecifrado());
