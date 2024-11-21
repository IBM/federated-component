declare var  __webpack_init_sharing__: (_0: string) => void; 
declare var __webpack_share_scopes__: {[k: string]: string};

interface Window {
    init: (_0: string) => void;
    get: <T>(_0: string) => () => { default: T; };
}
