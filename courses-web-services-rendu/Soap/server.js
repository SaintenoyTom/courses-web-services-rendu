const soap = require("soap");
const fs = require("node:fs");
const http = require("http");
const postgres = require("postgres");
 
const sql = postgres({ db: "mydb", user: "postgres", password: "admin" });

// Define the service implementation
const service = {
  ProductsService: {
    ProductsPort: {
      	
        CreateProduct: async function ({ name, about, price }, callback) {
            if (!name || !about || !price) {
              throw {
                Fault: {
                  Code: {
                    Value: "soap:Sender",
                    Subcode: { value: "rpc:BadArguments" },
                  },
                  Reason: { Text: "Processing Error" },
                  statusCode: 400,
                },
              };
            }
     
            const product = await sql`
              INSERT INTO products (name, about, price)
              VALUES (${name}, ${about}, ${price})
              RETURNING *
              `;
     
            // Will return only one element.
            callback(product[0]);
        },
        GetProducts: async function(callback){
            const products = await sql`
            SELECT * FROM products;
            `;
            return products;
        },
        PatchProduct: async function({ id, name, about, price }, callback){
            if (!name || !about || !price || !id) {
                console.log(id, name, about, price)
                throw {
                  Fault: {
                    Code: {
                      Value: "soap:Sender",
                      Subcode: { value: "rpc:BadArguments" },
                    },
                    Reason: { Text: "Processing Error" },
                    statusCode: 400,
                  },
                };
              }
            
            const productPatch = await sql`
            UPDATE products SET name = ${name}, about = ${about}, price = ${price} WHERE id = ${id}
            RETURNING *;
            `;
            callback(productPatch[0]);
        }
    },
  },
};

// Exemple de serveur HTTP
const server = http.createServer(function (request, response) {
    response.end("404: Not Found: " + request.url);
  });
  
  server.listen(8000);
  
  // Creation du serveur SOAP
  const xml = fs.readFileSync("productsService.wsdl", "utf8");
  soap.listen(server, "/products", service, xml, function () {
    console.log("SOAP server running at http://localhost:8000/products?wsdl");
  });