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
(async () => {
  const settings = new Settings()
  settings.webServiceURL = 'https://yadacoin.io'  # PUT YOUR NODE URL HERE
  const identity = new Identity(settings)
  const graph = new Graph(settings, identity)
  const user = await identity.getIdentity()
  const signature = await identity.getSignature('message to sign', 'iframe or window') // 'window' will open and load the identity widget into a popup window. 'iframe' will load the identity widget in an iframe with the id of yadacoin_identity_widget. If an element does not exist with that id, one will be created.
})
```
