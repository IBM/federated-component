/* eslint-disable no-undef,camelcase */
import {
    lazy,
    Suspense,
    useEffect,
    useState,
  } from 'react';
  
  // Components ----------------------------------------------------------------->
  import { ErrorBoundary } from './ErrorBoundary';
  import React from 'react';
  
  /**
   * Communicates with webpack to load a module via Webpack Module Federation.
   * @param scope Service scope.
   * @param module Remote component.
   * @returns {function(): Promise<*>} A promise that resolves the loaded component.
   */
  const loadComponent = (scope, module) => async () => {
    // Initializes the share scope. This fills it with known provided modules from this build and all remotes
    await __webpack_init_sharing__('default');
    const container = window[scope]; // or get the container somewhere else
    // Initialize the container, it may provide shared modules
    await container.init(__webpack_share_scopes__.default);
    const factory = await window[scope].get<React.ComponentType>(module);
    return factory();
  };
  
  const urlCache = new Set();
  /**
   * A hook that injects a remote JavaScript file into the DOM to be loaded.
   * @param url The url from where the script should be loaded.
   * @returns {{ready: boolean, errorLoading: boolean}} Returns if the script was loaded and is ready to be run or
   * if an error occurred while doing this.
   */
  const useDynamicScript = (url) => {
    const [ready, setReady] = useState(false);
    const [errorLoading, setErrorLoading] = useState(false);
  
    useEffect(() => {
      if (!url) return;
  
      if (urlCache.has(url)) {
        setReady(true);
        setErrorLoading(false);
        return;
      }
  
      setReady(false);
      setErrorLoading(false);
  
      const element = document.createElement('script');
  
      element.src = url;
      element.type = 'text/javascript';
      element.async = true;
  
      element.onload = () => {
        urlCache.add(url);
        setReady(true);
      };
  
      element.onerror = () => {
        setReady(false);
        setErrorLoading(true);
      };
  
      document.head.appendChild(element);
  
      // eslint-disable-next-line consistent-return
      return () => {
        urlCache.delete(url);
        document.head.removeChild(element);
      };
    }, [url]);
  
    return {
      errorLoading,
      ready,
    };
  };
  
  /**
   * Loads a remote React component via Webpack Module Federation.
   * @param remoteUrl The url of the service that exposes the component
   * @param scope The name of the service
   * @param module Component to load
   * @returns {{errorLoading: boolean, ResolvedFederatedComponent: RSX}} The resolved react component or an error that happend while doing this
   */
  export const useFederatedComponent = (remoteUrl, scope, module) => {
    const key = `${remoteUrl}-${scope}-${module}`;
    const [ResolvedFederatedComponent, setResolvedFederatedComponent] = useState<React.ComponentType<any> | null>(null);
  
    const { ready, errorLoading } = useDynamicScript(remoteUrl);
  
    useEffect(() => {
      if (ResolvedFederatedComponent) setResolvedFederatedComponent(null);
      // Only recalculate when key changes
    }, [key]);
  
    useEffect(() => {
      if (ready && !ResolvedFederatedComponent) {
        const Comp = lazy(loadComponent(scope, module));
        setResolvedFederatedComponent(Comp);
      }
      // key includes all dependencies (scope/module)
    }, [ResolvedFederatedComponent, ready, key, scope, module]);
  
    return { errorLoading, ResolvedFederatedComponent };
  };
  
  /**
   * This component loads a federated component from a remote location using webpack module federation and renderers it.
   * It takes the url, scope, and component from the <i>federationConfig</> and renders a loading component as a fallback
   * when the remote component is loaded and the error component fallback if something went wrong with loading or in the
   * remote component such that no error ever breaks the code using this component.
   */
  export const FederatedComponent = ({
    federationConfig, federatedComponentProps, ErrorComponent, LoadingComponent,
  }: FederationComponentProps) => {
    const { module, scope, url } = federationConfig;
  
    const { ResolvedFederatedComponent, errorLoading } = useFederatedComponent(url, scope, module);
  
    if (errorLoading) {
      return ErrorComponent;
    }
  
    return (
      <Suspense fallback={LoadingComponent}>
        <ErrorBoundary fallback={ErrorComponent}>
          {ResolvedFederatedComponent && (
            <ResolvedFederatedComponent {...federatedComponentProps} />
          )}
          {!ResolvedFederatedComponent && LoadingComponent}
        </ErrorBoundary>
      </Suspense>
    );
  };
  
  type FederationComponentProps = {
    /**
     * A config object, containing the module (the name of the service),
     * scope (component to resolve) and the full url where the remote entry point is located.
     */
    federationConfig: {
      module: string,
      scope: string,
      url: string,
    },
    /**
     * The props object that will be passed to the resolved component.
     */
    federatedComponentProps: {},
    /**
     * The fallback component that should be shown if something goes wrong while resolving or if the
     * resolved component crashes.
     */
    ErrorComponent: JSX.Element,
    /**
     * The fallback component that should be shown on loading.
     */
    LoadingComponent: JSX.Element,
  };
  
  