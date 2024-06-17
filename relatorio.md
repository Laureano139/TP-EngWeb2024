# Relatório - TP-EngWeb2024

## Introdução
Para a Unidade Curricular de Engenharia Web foi-nos proposto a realização de um trabalho prático. Neste trabalho, foi-nos fornecido múltiplos temas, sendo que o escolhido foi o "Ruas de Braga". Assim, ficamos responsabilizados por desenvolver um sistema capaz de armazenar, consultar e adicionar/remover/editar recursos relativos às ruas e casas de braga. Para além disso teriamos de fazer uma diferenciação entre utilizadores, cada um com permissões diferentes.


## API de Dados
### 1. Análise e Tratamento do Dataset

#### xml2jsonParser.py
Este script Python converte um conjunto de dados XML em JSON. Iremos descrever por passos o funcionamento do *script*:

- O script começa por importar os módulos necessários e criar a pasta "atual", se tal não existe. Se existir, lista todos os arquivos nessa pasta. Caso contrário, define uma lista vazia;
- De seguida, define várias funções para processar diferentes partes do arquivo XML. Cada função lida com um tipo específico de elemento XML e extrai as informações relevantes. Por exemplo, a função figurasAtuais procura imagens na pasta "atual" que começam com um determinado prefixo, enquanto a função parseFiguras extrai informações sobre figuras de um elemento XML;
- A função parseXML é a função principal para processar um arquivo XML, é responsável por ler o arquivo, extrair metadados, processar figuras e parágrafos, e retorna um objeto Python que representa todas as informações extraídas;
- A função parseXML é chamada repetidamente para todos arquivos XML e adiciona o objeto retornado a um conjunto de dados. Finalmente, escreve o conjunto de dados num arquivo JSON.


### setup-container.py 
Este script é usado para automizar o processo de criação do container docker com a base de dados mongodb e ficheiro JSON.


#### s.py
O script começa por importar os módulos necessários: json para manipulação de dados JSON e collections.OrderedDict para manter a ordem dos elementos no dicionário. De seguida, lê o ficheiro 'ruas.json' e carrega os dados para a variável data.

Definimos uma função chamada **update_structure** que recebe os dados carregados e realiza várias transformações:

- Cria um novo **OrderedDict** para cada item no conjunto de dados. A ordem dos elementos é mantida no **OrderedDict**;
- Adiciona um novo campo *'_id'* no início de cada item, que é a string do índice do item (começando em 1);
- Garante que o campo *'numero'* de cada item é uma string;
- Copia todos os outros campos do item original para o novo **OrderedDict**, exceto os campos *'_id'* e *'numero'*;
- Para cada *'figura'* em cada item, se existir, converte o *'_id'* da *'figura'* para uma string;
- Para cada *'casa'* em cada item, se existir, converte o *'numero'* da *'casa'* e os dados aninhados para strings;
- Adiciona o novo **OrderedDict** a uma lista de dados atualizados;
- A função **update_structure** é então chamada com os dados carregados do arquivo JSON e os dados transformados são guardados na variável **updated_data**.

Finalmente, o script guarda os dados transformados de volta num arquivo JSON chamado **'updated_data.json'** e imprime uma mensagem para indicar que o processo foi concluído.


### 2. Definição do Modelo da BD e da API
No código apresentado, é definido a estrutura dos dados que serão armazenados na base de dados MongoDB. 
Cada esquema corresponde a um tipo de documento que pode ser armazenado na base de dados, e os esquemas são usados para validar os dados antes de serem armazenados.

```javascript
var refSchema = new mongoose.Schema({
    entidades: [
        {
            nome: String,
            tipo: {
                type: String,
                enum: ['pessoa', 'instituição', 'empresa', 'família'],
                default: 'pessoa'
            }
        }
    ],
    lugares: [
        {
            nome: String,
            norm: String
        }
    ],
    datas: [String]
}, { _id: false });

var figuraSchema = new mongoose.Schema({
    _id: String,
    legenda: String,
    imagem: {
        path: String,
        largura: String
    }
});

var casasSchema = new mongoose.Schema({
    numero: String, // Convert numero to String
    enfiteutas: String,
    foro: String,
    desc: {
        refs: refSchema,
        texto: String
    },
    vista: String
}, { _id: false });

var comentarioSchema = new mongoose.Schema({
    // _id: String,
    autor: String,
    data: String,
    texto: String
});

const ruaSchema = new mongoose.Schema({
    _id: String,
    numero: String,
    nome: String,
    pos: {
        latitude: Number,
        longitude: Number
    },
    figuras: [figuraSchema],
    paragrafo: {
        refs: refSchema,
        texto: String
    },
    casas: [casasSchema],
    comentarios: [comentarioSchema]
}, { versionKey: false });

```
As principais funções da API que este módulo fornece:

- **list:** Apresenta todas as ruas na base de dados.
- **findById:** Encontra uma rua específica pelo seu ID.
- **findRuaByNome:** Encontra uma rua específica pelo seu nome.
- **listaRuasByData:** Apresenta todas as ruas que têm uma data específica nas suas casas ou parágrafos.
- **listaRuasByLugar:** Apresenta todas as ruas que têm um lugar específico nas suas casas ou parágrafos.
- **insert:** Insere uma nova rua na base de dados.
- **deleteRua:** Deleta uma rua específica pelo seu ID.
- **update:** Atualiza uma rua específica pelo seu ID.
- **adicionarComentario:** Adiciona um comentário a uma rua específica.
- **removerComentario:** Remove um comentário de uma rua específica.


## Funcionalidades da plataforma
A função **verificaToken** é usada para verificar a validade de um token *JWT (JSON Web Token)*. Ela procura o *token* em três lugares diferentes: na *query string*, no corpo da requisição e nos *cookies*. Se o *token* for encontrado e for válido, a função *next* é chamada, permitindo que o fluxo de execução continue para a próxima função *middleware*. Se o token não for encontrado ou for inválido, a função retorna uma resposta com o *status 401*, indicando uma falha de autenticação.

A função **ensureDirExists** é usada para garantir que uma diretoria especificada exista no sistema de arquivos. Se a diretoria não existir, será criada. Esta função usa métodos do módulo fs do Node.js para interagir com o sistema de arquivos.

Além disso, o código define uma configuração de armazenamento para o módulo *multer*, que é usado para lidar com o upload de arquivos. Esta configuração especifica que os arquivos devem ser armazenados no disco e define a lógica para determinar a diretoria de destino e o nome do arquivo. A função **ensureDirExists** é usada aqui para garantir que a diretoria de destino exista antes de tentar salvar um arquivo nele.

A rota **GET /**: Esta rota representa a página principal do site, por onde é possível registar e fazer log In.

A rota **GET /ruas**: Esta rota verifica se um *token* de autenticação está presente nos *cookies* da solicitação. Se o *token* estiver presente e for válido, ele recupera o nível e o nome do utilizador do *token*. Em seguida, faz um pedido GET para um serviço externo para obter uma lista de "ruas" e renderiza uma página com essas informações. Se o *token* não estiver presente ou for inválido, ele renderiza a página para um nível de uti.izador padrão.

A rota **GET /delete/:id**: Esta rota recebe um ID como parâmetro na URL. Faz um pedido GET para um serviço externo para obter informações sobre uma "rua" específica, incluindo caminhos para imagens associadas. De seguida, tenta excluir essas imagens do sistema de ficheiros local. Finalmente, faz um pedido DELETE para o serviço externo para excluir a "rua" e redireciona o utilizador para a página '/ruas'.

A rota **GET /criar**: Esta rota renderiza a página 'novaRua' com a data atual. Se um *token* de autenticação estiver presente nos *cookies* da solicitação, ele será verificado.

A rota **POST /criar**: Esta rota recebe dados de um formulário e cria um novo objeto "rua". Processa várias partes dos dados do formulário, incluindo entidades, lugares, datas, casas e figuras (imagens). Em seguida, envia um pedido POST para um serviço externo para criar a "rua". Se houver arquivos de imagem incluídos na solicitação, eles serão adicionados ao objeto "rua". Finalmente, ele redireciona o utilizador para a página '/ruas'.

A rota **POST /:id/post**: Esta rota recebe dados de um formulário para criar um novo comentário numa "rua" específica. Verifica se um token de autenticação está presente e, em caso afirmativo, extrai o nome de utilizador do *token*. Em seguida, envia um pedido POST para um serviço externo para criar o comentário.

A rota **GET /:idRua/unpost/:id**: Esta rota recebe dois IDs como parâmetros URL: o ID de uma "rua" e o ID de um comentário. Envia um pedido DELETE para um serviço externo para excluir o comentário da "rua".

A rota **GET /editar/:id**: Esta rota recebe um ID como parâmetro URL e faz um pedido GET para um serviço externo para obter informações sobre a "rua" correspondente. Se a "rua" for encontrada, renderiza a página 'editarRua' com os dados da "rua" e a data atual. Se a "rua" não for encontrada, retorna um erro 404. Se ocorrer um erro durante a solicitação GET, renderiza a página de erro.

A rota **POST /editar/:id**: Esta rota recebe um ID como parâmetro URL e dados de um formulário para atualizar a "rua" correspondente. Faz um pedido GET para o serviço externo para obter a "rua" atual, de seguida, cria um novo objeto "rua" com os dados do formulário. Processa várias partes dos dados do formulário, incluindo números, nomes, posições, figuras (imagens), parágrafos, casas e comentários, também lida com a exclusão de imagens antigas e a adição de novas imagens. Finalmente, faz um pedido PUT para o serviço externo para atualizar a "rua" e redireciona o utilizador para a página '/ruas'. Se ocorrer um erro durante a solicitação PUT, renderiza a página de erro.

Para as seguintes três rotas é verificado, se um token de autenticação está presente nos cookies da solicitação. Se o token estiver presente e for válido,  extrai o nome de utilizador do token. Se o token não estiver presente ou for inválido, ele define o nível do utilizador como "Utilizador".

A rota **GET /datas/:data**: Esta rota recebe uma data como parâmetro URL e faz um pedido GET para um serviço externo para obter todas as "ruas" que correspondem a essa data. Em seguida, renderiza a página 'datas' com as "ruas" retornadas e a data atual.

A rota **GET /entidades/:entidade**: Esta rota recebe uma entidade como parâmetro URL e faz um pedido GET para um serviço externo para obter todas as "ruas" que correspondem a essa entidade. Em seguida, renderiza a página 'entidades' com as "ruas" retornadas e a data atual.

A rota **GET /lugares/:lugar**: Esta rota recebe um lugar como parâmetro URL e faz um pedido GET para um serviço externo para obter todas as "ruas" que correspondem a esse lugar. De seguida, renderiza a página 'lugares' com as "ruas" retornadas e a data atual.

As rotas **GET /register**, **GET /login**, **GET /logout**: Estas rotas renderizam os formulários de registo, login e logout, respectivamente. Elas verificam se um token de autenticação está presente nos cookies da solicitação e, se estiver, verificam se o token é válido.

As rotas **POST /register**, **POST /login**: Estas rotas recebem dados de um formulário para registrar um novo utilizador ou fazer login de um utilizador existente, respectivamente. Enviam um pedido POST para um serviço externo com os dados do formulário e, se a solicitação for bem-sucedida, armazenam o token de autenticação retornado nos cookies da resposta.

A rota **POST /logout**: Esta rota limpa o token de autenticação dos cookies da resposta.

A rota **GET /:id**: Esta rota recebe um ID como parâmetro URL e faz um pedido GET para um serviço externo para obter informações sobre a "rua" correspondente. Processa os dados retornados para criar links para entidades, lugares e datas mencionados no parágrafo da "rua". Em seguida, renderiza a página 'rua' com os dados da "rua" e a data atual.

As funções **escapeRegExp** e **safeReplace** são usadas para substituir seguramente ocorrências de entidades, lugares e datas no texto do parágrafo por links.


## Autenticação
Esta camada aplicacional é responsável pela autenticação e registo de utilizadores da plataforma. 
No código apresentado, é definido a estrutura de um utilizador.

```javascript  
var userSchema = new  mongoose.Schema({
    username: String,
    password: String,
    name: String,
    email: String,
    filiation: String,
    level: String,
    dateCreated: String,
    dateLastAccess: String,
    active: Boolean
})

```

Utilizamos o **jsonwebtoken** para realizar a autenticação de todos os utilizadores, recorrendo posteriormente a esse token para obter dados da API via Interface. A Interface tem rotas protegidas (como adicionar/editar casas e ruas e eliminar comentários) no qual é necessário estar *logged In* para realizar estas ações. 

Cada utilizador é possui também um nível de acesso (Utilizador ou Admin), sendo que os Utilizadores apenas não têm acesso à funcionalidade de eliminação de comentários e editar/eliminar ruas, que são exclusivas dos Admins.


## Conclusão
Neste relatório, detalhamos o desenvolvimento de um sistema completo para a gestão de informações sobre as ruas e casas de Braga. Através do uso de várias tecnologias, como MongoDB, Docker, e APIs RESTful, o sistema permite a manipulação de dados de forma segura e eficaz, diferenciando os níveis de acesso entre utilizadores comuns e administradores.

Em suma, o projeto não só atendeu aos requisitos propostos pela unidade curricular de Engenharia Web, como também  serviu como uma excelente oportunidade para aplicar conceitos teóricos num contexto prático, contribuindo significativamente para o desenvolvimento de competências técnicas e profissionais.
