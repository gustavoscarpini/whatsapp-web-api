# zapzap API

Aplicação para envio de mensagens no whatsapp-web via REST

## How to RUN this bagaça
Ajuste a conexão do mongoDB no .env

Rode o comando para instalar as parada tudo
```
npm install
```
 
Agora suba o projeto com

```
npm start
```

### Para criar uma nova instância faça um post em

```
http://localhost:3000/api/create
{
    "name" : "Nome da Instancia"
}
```
Obs. Guarde o UUID que retornar nesse POST.

no console da app vai renderizar o QRCode do whatsapp, escaneie com o seu dispositivo.

### Para enviar Mensagens use o POST

```
http://localhost:3000/api/send
{
    "phone" : "554498085942",
    "message": "Oie novamente, de novo",
    "clientId":"69b9916b-035c-4f96-8df6-201a23c5c1e7" //aqui vai aquele uuid que você guardou
}
```


Vc tbm pode ver todas as instancias online em 

```=
GET http://localhost:3000/api/getAll
```