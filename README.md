# SQLite Console — GitHub Pages + Termux

## GitHub Pages
O site usa HTML, CSS e JavaScript no navegador. O motor SQLite (`sql.js`) e o arquivo WebAssembly ficam em `vendor/sql.js/`, portanto não há dependência de PHP, backend ou CDN.

1. Envie todos os arquivos e pastas deste projeto para um repositório GitHub.
2. Abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch (por exemplo `main`) e a pasta `/ (root)`.
5. Salve e acesse a URL publicada.

O banco do navegador é mantido em memória durante a sessão. Para persistência entre sessões, seria necessário implementar exportação/importação ou armazenamento local no navegador.

## Termux
Entre na pasta do projeto e execute:

```sh
chmod +x run.sh
./run.sh
```

Ou:

```sh
npm install
npm start
```

O modo Termux usa `code.sql` para criar o banco na primeira execução e salva os dados em `store.db`. Para recriar o banco a partir de `code.sql`:

```sh
node start.js --reset
```

Requer Node.js e npm instalados. O `run.sh` tenta instalar Node.js pelo gerenciador `pkg` quando necessário.

## Arquivos principais
- `index.html`: interface.
- `style.css`: tema azul escuro/preto.
- `app.js`: execução SQL no navegador e renderização de resultados.
- `vendor/sql.js/`: biblioteca sql.js e WebAssembly local.
- `start.js`: execução SQLite pelo Node.js no Termux.
- `code.sql`: script inicial do banco.
