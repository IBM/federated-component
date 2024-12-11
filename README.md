# federated-component
Dynamic import of remote components with module federation

# How to?

1) Install the library:

```
npm i @ibm/federated-component
```

2) Define a `config` object:

Let's say you have the following module federation config in your remote:
```
() => new ModuleFederationPlugin({
  name: 'my_components',
  filename: 'my_script.js',
  exposes: {
    './MyComponent': '<SOME PATH>',
  },
```

Then, create the following config:

```
config= {
  module: "./MyComponent",
  scope:  "my_components",
  url: `<URL>/my_script.js?t=${Date.now()}`, 
}
```

Note that, timestamp is added as a query param to bust the cache and always get the newest version.
You might not need it although we recommend keeping it to get always the latest version of the component, 
especially if you are using browser caching or CDN for example.

3) Import the FederatedComponent to download dynamically the script at runtime:

```
import { FederatedComponent } from "@ibm/federated-component";

...

<FederatedComponent
    federationConfig={config}
    federatedComponentProps={<CUSTOM PROPS>}
    ErrorComponent={<FALLBACK IN CASE OF ERROR>}
    LoadingComponent={<SOME COMPONENT>}
/>
```



