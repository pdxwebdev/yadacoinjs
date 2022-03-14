# WEB 3.0 Framework - YadaCoinJS

## Setup
 - npm install crypto-js
 - add the following to your tsconfig.json inside of compilerOptions
```
,
"paths": {
  "crypto": [
    "node_modules/crypto-js"
  ]
}
```

## Usage
```
const settings = new Settings()
settings.webServiceURL = 'https://yadacoin.io'  # PUT YOUR NODE URL HERE
this.identity = new Identity(settings)
this.graph = new Graph(settings, this.identity)
const identity = await this.identity.getIdentity()
```