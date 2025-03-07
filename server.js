const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('fs')

const app = express();
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/title.html')
})

const PORT = 3000;

const schema = buildSchema(`
    type Product {
        id: ID!
        name: String!
        price: Int!
        description: String!
        categoryIds: [Int]
    }
    type Category {
        id: ID!
        name: String!
        products: [Product]
    }
    
    type Query {
        categories: [Category]
    }
`);

class Product {
    constructor({ id, name, price, description }) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
    }
}

class Category {
    constructor({ id, name, products }) {
        this.id = id;
        this.name = name;
        this.products = products;
    }
}

let root = {
    categories: () => {
        let data;
        try {
            data = fs.readFileSync('./data.json', 'utf-8');
        } catch (err) {
            console.error(err);
        }

        let jsonData = JSON.parse(data);
        let result = [];
        for (const category of jsonData.categories) {
            let categoryJson = new Category(category);
            categoryJson.products = [];
            for (const product of jsonData.products) {
                for (const categoryId of product.categoryIds) {
                    if (categoryId === category.id) {
                        categoryJson.products.push(new Product(product));
                        break;
                    }
                }
            }
            result.push(categoryJson);
        }
        return result;
    },
}

app.use(
    '/graphql',
    graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    }),
);


app.listen(PORT, () => {
    console.log("Server is running on http://localhost:", PORT);
});


const WebSocket = require("ws");
const ws_server = new WebSocket.Server({port: 8082});

const clients = [];

ws_server.on("connection", onConnect);
function onConnect(client) {
    console.log("Connection opened");

    clients.push(client);

    client.on("message", function(data) {
        const clientData = JSON.parse(data);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(clientData));
            }
        });
    });
    client.on("close", function() {
        const index = clients.indexOf(client);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });
}